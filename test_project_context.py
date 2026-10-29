import copy
import unittest
import os
import tempfile
from project_context import ProjectObserver,digest,read_snapshot,managed_backup_path


def snapshot(path='C:/projects/a.zprj',ids=(1,),geometry='a',stamp=1):
    parts=[{'pattern_id':i,'name':'Деталь '+str(i),'fingerprint':geometry+str(i)} for i in ids]
    return {'available':True,'name':'Новый проект' if not path else path.split('/')[-1], 'path':path,'parts':parts,
            'content_digest':digest(parts),'file_stamp':{'mtime_ns':stamp} if path else None}


class ProjectObservationTests(unittest.TestCase):
    def test_edit_rename_move_delete_and_save_preserve_document(self):
        o=ProjectObserver();first=o.observe(snapshot(ids=(1,2)));doc=first['document_id']
        for s in (snapshot(ids=(1,2,3)),snapshot(ids=(1,3)),snapshot(ids=(1,3),geometry='moved'),snapshot(ids=(1,3),geometry='renamed'),snapshot(ids=(),stamp=2)):
            self.assertEqual(o.observe(s)['document_id'],doc)
        self.assertEqual(o.observe(snapshot(ids=(),stamp=3))['event'],'saved')

    def test_save_as_preserves_working_document_but_open_another_resets(self):
        o=ProjectObserver();a=o.observe(snapshot())
        b=o.observe(snapshot('C:/projects/b.zprj'));self.assertEqual(a['document_id'],b['document_id']);self.assertEqual(b['event'],'save_as')
        c=o.observe(snapshot('C:/other/b.zprj',ids=(9,)));self.assertNotEqual(b['document_id'],c['document_id'])
        d=o.observe(snapshot(path=None,ids=()));self.assertNotEqual(c['document_id'],d['document_id'])

    def test_identical_empty_unsaved_is_reported_as_unobservable(self):
        o=ProjectObserver();a=o.observe(snapshot(None,()));b=o.observe(snapshot(None,()))
        self.assertEqual(a['document_id'],b['document_id']);self.assertFalse(b['lifecycle_events_available']);self.assertTrue(b['limitations'])

    def test_guard_blocks_foreign_project_old_geometry_and_old_chat(self):
        o=ProjectObserver();a=o.observe(snapshot());guard={k:a[k] for k in ('document_id','generation','content_digest')};guard['context_session_id']='chat-a'
        o.guard(guard,a,{'document_id':a['document_id'],'context_session_id':'chat-a'})
        with self.assertRaisesRegex(ValueError,'Диалог'):o.guard(guard,a,{'document_id':a['document_id'],'context_session_id':'chat-b'})
        b=o.observe(snapshot(geometry='changed'))
        with self.assertRaisesRegex(ValueError,'Содержимое'):o.guard(guard,b)
        c=o.observe(snapshot('C:/other.zprj',ids=(55,)))
        with self.assertRaisesRegex(ValueError,'сменился'):o.guard(guard,c)

    def test_hot_reload_preserves_document_and_own_batch_is_content_change(self):
        o=ProjectObserver();a=o.observe(snapshot(None,(1,)))
        new=ProjectObserver(o.state);b=new.observe(snapshot(None,(88,99)),known_mutation=True)
        self.assertEqual(a['document_id'],b['document_id'])

    def test_native_backup_export_is_not_a_new_document_or_user_save_as(self):
        backup=os.path.join(tempfile.gettempdir(),'CLO_AI_Backups','batch_test.zprj')
        o=ProjectObserver();before=o.observe(snapshot('C:/projects/Моя футболка.zprj',()))
        after=o.observe(snapshot(backup,(11,12),stamp=9),known_mutation=True)
        self.assertEqual(after['document_id'],before['document_id'])
        self.assertEqual(after['path'],before['path']);self.assertEqual(after['name'],before['name'])
        self.assertEqual(after['managed_backup_path'],backup);self.assertEqual(after['native_path'],backup)
        # Subsequent polling and bridge hot reload still see CLO's backup path.
        reloaded=ProjectObserver(o.state)
        polled=reloaded.observe(snapshot(backup,(11,12),stamp=9))
        self.assertEqual(polled['path'],before['path']);self.assertEqual(polled['document_id'],before['document_id'])
        saved=reloaded.observe(snapshot('C:/projects/Футболка S.zprj',(11,12),stamp=10))
        self.assertEqual(saved['event'],'save_as');self.assertEqual(saved['path'],'C:/projects/Футболка S.zprj')
        self.assertNotIn('managed_backup_path',saved)

    def test_backup_alias_does_not_hide_an_explicit_different_document(self):
        backup=os.path.join(tempfile.gettempdir(),'CLO_AI_Backups','batch_test.zprj')
        other=os.path.join(tempfile.gettempdir(),'CLO_AI_Backups','batch_other.zprj')
        o=ProjectObserver();a=o.observe(snapshot(None,()))
        b=o.observe(snapshot(backup,(11,)),known_mutation=True)
        self.assertIsNone(b['path']);self.assertEqual(a['document_id'],b['document_id'])
        c=o.observe(snapshot(other,(44,)))
        self.assertEqual(c['path'],other);self.assertNotEqual(c['document_id'],b['document_id'])
        reopened=ProjectObserver();original=reopened.observe(snapshot('C:/projects/a.zprj',(1,)))
        exported=reopened.observe(snapshot(backup,(1,2)),known_mutation=True)
        actual_open=reopened.observe(snapshot(backup,(99,)))
        self.assertEqual(actual_open['path'],backup)
        self.assertNotEqual(actual_open['document_id'],original['document_id'])
        # Initially opening a backup is a real project, not a synthetic alias.
        initial=ProjectObserver().observe(snapshot(backup,(11,)))
        self.assertEqual(initial['path'],backup);self.assertNotIn('native_path',initial)
        self.assertFalse(managed_backup_path(os.path.join(tempfile.gettempdir(),'CLO_AI_Backups_other','a.zprj')))

    def test_snapshot_reads_actual_api_and_normalizes_null_path(self):
        from test_clo_operations import FakeCLO
        class Utility:
            def GetProjectNameW(self):return 'Без имени'
            def GetProjectFilePathW(self):return 'NULL'
        api=FakeCLO();api.CreatePatternWithPoints([(0,0,0),(20,0,0),(20,30,0),(0,30,0)])
        a=read_snapshot(api,Utility());self.assertIsNone(a['path']);self.assertEqual(a['parts'][0]['width_mm'],20)
        api.pieces[0]['points'][0]=(1,0,0);b=read_snapshot(api,Utility());self.assertNotEqual(a['content_digest'],b['content_digest'])
