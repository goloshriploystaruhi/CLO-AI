// No UI and no real user data. Confirm that the branded copy is the same runtime
// and can decrypt the original runtime's isolated safeStorage credential.
const {app,safeStorage}=require('electron'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const [folder,mode]=process.argv.slice(2);
if(!folder||!path.isAbsolute(folder)||!fs.existsSync(folder)||!['original','branded'].includes(mode))throw Error('Нужна изолированная папка проверки');
app.setName('CLO AI');const defaultUserData=app.getPath('userData');app.setPath('userData',path.join(folder,'data'));app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 try{
  if(!safeStorage.isEncryptionAvailable())throw Error('Windows не предоставила шифрование учётных данных');
  const credential=path.join(folder,'isolated-credential.bin'),secret='CLO AI runtime migration isolated credential';
  if(mode==='original')fs.writeFileSync(credential,safeStorage.encryptString(secret));
  else if(safeStorage.decryptString(fs.readFileSync(credential))!==secret)throw Error('Не удалось прочитать изолированные учётные данные');
  const icon=await app.getFileIcon(process.execPath,{size:'normal'}),expected=await app.getFileIcon(path.join(__dirname,'../CLO AI.exe'),{size:'normal'});
  const fingerprint=image=>crypto.createHash('sha256').update(image.toBitmap()).digest('hex');
  const result={mode,exec_path:process.execPath,app_name:app.getName(),electron:process.versions.electron,node:process.versions.node,user_data:app.getPath('userData'),default_user_data:defaultUserData,is_packaged:app.isPackaged,credential_roundtrip:mode==='branded',shell_icon_sha256:fingerprint(icon),expected_icon_sha256:fingerprint(expected),shell_icon_size:icon.getSize()};
  fs.writeFileSync(path.join(folder,mode+'.json'),JSON.stringify(result));app.quit();
 }catch(error){fs.writeFileSync(path.join(folder,mode+'-error.txt'),error.stack);app.exit(1);}
});
