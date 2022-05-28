// Modules to control application life and create native browser window
const electron = require('electron')
const path = require('path')
const qianggou = require('./duoxiancheng')
const queryContract = require("./dealContract")
const schedule = require('node-schedule');

const ipcMain = electron.ipcMain
const app = electron.app
const BrowserWindow = electron.BrowserWindow

let mainWindow = null
function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 1100,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),

      nodeIntegration: true,
      contextIsolation: false

    }
  })

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

  //const mainMenu = Menu.buildFromTemplate(menuTemplate);
  //Menu.setApplicationMenu(mainMenu);
  // Open the DevTools.
  //mainWindow.webContents.openDevTools()

  
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.


const eventListener = async () => {
  ipcMain.on('info:initweb3', async (e, value) => {
    console.log("info:initweb3");
    console.log(value)
    result = qianggou.initWeb3(value)
    qianggou.setmainWindow( mainWindow);
    mainWindow.webContents.send("info:initweb3", { result });
  })

  ipcMain.on('info:qianggou', async (e, value) => {
    console.log("info:qianggou");
    console.log(value)
    result = qianggou.qianggou(value)

    mainWindow.webContents.send("info:qianggou", { result });
  })

  ipcMain.on('info:test', async (e, value) => {
    console.log("info:test");
    console.log(value)
    result = qianggou.test(value)

    mainWindow.webContents.send("info:test", { result });
  })
  
  ipcMain.on('info:queryabi', async (e, value) => {
    console.log("info:queryabi");
    console.log(value)

    result = await queryContract.start(value)

    mainWindow.webContents.send("info:queryabi", { result });
  })

  ipcMain.on('info:abishiyong', async (e, value) => {
    console.log("info:abishiyong");
    console.log(value)
    result = qianggou.abishiyong(value)

  })

  ipcMain.on('info:checkapprove', async (e, value) => {
    console.log("info:checkapprove");
    console.log(value)
    result = qianggou.checkapprove(value)
    
  })

  // gst/usdc lp:0x09fe9db65c44b9610ab7dcd6853f887d2ade7e7f
  // gst 地址:0x4a2c860cEC6471b9F5F5a336eB4F38bb21683c98
  // usdc 地址：0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d

  var rewu = null;

  ipcMain.on('info:listenprice', async (e, value) => {
    console.log("info:listenprice");
    console.log(value)
    bstart = true;
    rewu = await task1(value);
    //result = qianggou.checkapprove(value)
    
  })

  ipcMain.on('info:stoplistenprice', async (e, value) => {
    console.log("info:stoplistenprice");
    console.log(value)
    if(rewu!=null)
    {
      rewu.cancel();
      rewu = null;
      msg = "停止成功";
      mainWindow.webContents.send("info:msg", { msg });
    }
   // monitorprice(value);
    //result = qianggou.checkapprove(value)
    
  })

  var buyinfo = null

  ipcMain.on('info:startbuy', async (e, value) => {
    console.log("info:startbuy");
    console.log(value)
    buyinfo = value;
   // monitorprice(value);
    //result = qianggou.checkapprove(value)
    
  })

  ipcMain.on('info:stopbuy', async (e, value) => {
    console.log("info:stopbuy");
    console.log(value)
    buyinfo = null;
   // monitorprice(value);
    //result = qianggou.checkapprove(value)
    
  })

  ipcMain.on('info:autobuy', async (e, value) => {
    console.log("info:autobuy");
    console.log(value)
    //await autobuy()
   // monitorprice(value);
    //result = qianggou.checkapprove(value)
    
  })

  
  const autobuy = async(price,tokeninfo) =>{
    if(buyinfo!=null)
    {
        if(Number(price)<Number(buyinfo.buyprice))
        {
            //自动买入
           qianggou.buytokenall(buyinfo,tokeninfo);
           //buyinfo = null;
        }
        else if(Number(price)>Number(buyinfo.sellprice))
        {
            //自动卖出
            qianggou.selltokenall(buyinfo,tokeninfo);
            //buyinfo = null;
        }
    }
  }


  const task1 = async (value)=>{
    //每分钟的1-10秒都会触发，其它通配符依次类推
    //console.log("123111");
    //console.log(value);
    //console.log(count);
    const j = schedule.scheduleJob('*/5 * * * * *', async ()=>{
      
     await monitorprice(value);
    })
    return j;
  }

  const monitorprice = async(value) =>{
    lpaddress = value.lpaddress;
    tokenaddress = value.lptokenaddress;
    usdcaddress = value.lptoken1address;
    
  
  
        // 
        try
        {
          result = await qianggou.getprice(lpaddress,usdcaddress,tokenaddress);
          symbol = await qianggou.gettokenname(tokenaddress);
          usdc = await qianggou.gettokenname(usdcaddress)
          msg = "代币"+symbol+"当前价格为：" + result + usdc;
          mainWindow.webContents.send("info:msg", { msg });
          autobuy(result,value);
          //sendmsg = {result,value};
          //ipcMain.emit('info:autobuy',  sendmsg,sendmsg )
          
        }
        catch(e)
        {
          console.log(e);
        }
      
  
    
  }
  
}
var bstart = false;
eventListener();

