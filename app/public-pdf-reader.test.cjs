const {test}=require('node:test'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process'),os=require('node:os'),path=require('node:path');
const {readPdf,PDF_LIMITS}=require('./public-pdf-reader.cjs');
const python=require('./python-runtime.cjs').executable();
const fixture=spawnSync(python,['-I','-B','-c',`
import io,json,base64
from reportlab.pdfgen import canvas
from pypdf import PdfReader,PdfWriter
from pypdf.generic import NameObject,DecodedStreamObject
def make(pages=1,long=False):
 out=io.BytesIO(); c=canvas.Canvas(out,pageCompression=1); c.setTitle('Technical drafting note')
 for p in range(pages):
  c.drawString(30,750,'PAGE_'+str(p+1)+' Pattern draft: line A to B.')
  if long:
   for i in range(200): c.drawString(30,730-i*8,'Unverified geometric construction reference '+str(i)+' '+('reference '*20))
  c.showPage()
 c.save(); return out.getvalue()
valid=make(); w=PdfWriter(); w.append(PdfReader(io.BytesIO(valid))); w.encrypt('private'); encrypted=io.BytesIO();w.write(encrypted)
w=PdfWriter();w.add_blank_page(width=500,height=500); blank=io.BytesIO();w.write(blank)
w=PdfWriter();p=w.add_blank_page(width=500,height=500);s=DecodedStreamObject();s.set_data(b' '*(1024*1024+100));p[NameObject('/Contents')]=w._add_object(s.flate_encode());bomb=io.BytesIO();w.write(bomb)
w=PdfWriter();w.append(PdfReader(io.BytesIO(valid)));w.add_js('this.exportDataObject({cName:"never-run"});');actions=io.BytesIO();w.write(actions)
print(json.dumps({k:base64.b64encode(v).decode() for k,v in dict(valid=valid,encrypted=encrypted.getvalue(),blank=blank.getvalue(),bomb=bomb.getvalue(),pages=make(15),long=make(long=True),actions=actions.getvalue()).items()}))
`],{windowsHide:true,maxBuffer:4*1024*1024,encoding:'utf8'});
assert.equal(fixture.status,0,fixture.stderr);const docs=Object.fromEntries(Object.entries(JSON.parse(fixture.stdout)).map(([k,v])=>[k,Buffer.from(v,'base64')]));
test('an actual public PDF is read as text with title and transparent coverage',async()=>{const result=await readPdf(docs.valid);assert.equal(result.format,'pdf');assert.match(result.text,/Pattern draft: line A to B/);assert.equal(result.title,'Technical drafting note');assert.equal(result.page_count,1);assert.equal(result.pages_read,1);assert.equal(result.coverage.complete,true);assert.equal(result.coverage.ocr_performed,false);assert.equal(result.coverage.images_analyzed,false);});
test('PDF pages and extracted text stay bounded, and partial documents are never reported complete',async()=>{const pages=await readPdf(docs.pages);assert.equal(pages.page_count,15);assert.equal(pages.pages_read,12);assert.match(pages.text,/PAGE_12/);assert.doesNotMatch(pages.text,/PAGE_13/);assert.equal(pages.coverage.pages_limited,true);assert.equal(pages.coverage.complete,false);const long=await readPdf(docs.long);assert(long.text.length<=PDF_LIMITS.textCharacters);assert.equal(long.coverage.text_limited,true);assert.equal(long.coverage.complete,false);});
test('encrypted, image-only or empty and malformed PDF resources are recoverable source failures',async()=>{for(const [bytes,reason]of [[docs.encrypted,'encrypted'],[docs.blank,'no_text'],[Buffer.from('%PDF-broken'),'invalid_pdf'],[Buffer.from('<html>not PDF</html>'),'invalid_pdf']])await assert.rejects(readPdf(bytes),e=>e.code==='research_pdf'&&e.reason===reason&&e.recoverable===true);});
test('oversized downloads and compressed content bombs fail before unbounded extraction',async()=>{await assert.rejects(readPdf(Buffer.alloc(PDF_LIMITS.bytes+1)),e=>e.reason==='too_large');assert(docs.bomb.length<10000,'compressed resource fixture must exercise expansion limit');await assert.rejects(readPdf(docs.bomb),e=>e.reason==='resource_limit'&&e.recoverable===true);});
test('page actions are inert and are not included as extracted source instructions',async()=>{const result=await readPdf(docs.actions);assert.match(result.text,/Pattern draft/);assert.doesNotMatch(result.text,/exportDataObject|never-run/);});
test('a per-document timeout is recoverable while an external abort retains its original reason',async()=>{await assert.rejects(readPdf(docs.valid,{timeoutMs:1}),e=>e.code==='research_pdf'&&e.reason==='timeout'&&e.recoverable===true);const controller=new AbortController(),reason=Object.assign(Error('Stop requested'),{name:'AbortError'}),promise=readPdf(docs.valid,{signal:controller.signal});controller.abort(reason);await assert.rejects(promise,e=>e===reason);await assert.rejects(readPdf(docs.valid,{signal:controller.signal}),e=>e===reason);});
