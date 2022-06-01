//这里用bsc 链举例子
//加载web3的库
var moment = require('moment');
var Web3 = require('web3');
var fs = require('fs');
var mainWindow = null; //用来给前台发信息
var web3 = null;
var chainid = 1;
var nownetwork = 'eth';
var priKeys = getPriKeys("./prikey.prikey")
process.env.UV_THREADPOOL_SIZE =20
var web4 = new Web3()
var erc20 = require('./erc20.js')
var erc20abi = loadabi(erc20);


//加载钱包配置文件
var walletconfig = null

function reload()
{
    var tmp = fs.readFileSync("./wallet.json");
    walletconfig = JSON.parse(tmp);
}

reload();

var pancakeabi = loadabi( require('./pancake.js'))
//加载abi
function loadabi(jsData) {
    var tmpabimap  = new Map();
    jsData.forEach(element => {
        if (element.type == "function") {
            sign = web4.eth.abi.encodeFunctionSignature(element);
            tmpabimap.set(sign, element);
        }
    });
    return tmpabimap;
}

//获得对应的abi
function getAbi(abimap, name) {
    var bfind = false;
    var r;
    abimap.forEach(element => {
        ////console.log(element.name)
        ////console.log("---------------")
        if (element.name == name) {
            //console.log("找到")
            bfind = true;
            r = element;
            return false;
        }
    });
    return [bfind, r];
}


function getPriKeys(prikeyPath) {

    var filecon = fs.readFileSync(prikeyPath).toString();
    filecon = filecon.replace("\r"), "";
    var privKeyFile = filecon.split("\n");

    var arr = new Array();
    for (line in privKeyFile) {
        privKeyFile[line] = privKeyFile[line].replace("0x", "");
        //console.log(privKeyFile[line]);
        arr.push(new Buffer.from(privKeyFile[line].trim(), "hex"))
    }
    //console.log(arr);
    return arr;
}
function initWeb3(value) {
    if (web3 != null) {
        web3 = null;
    }
    if (value.webtype == 'rpc') {
        var rpcweb3 = new Web3(new Web3.providers.HttpProvider(value.weburl));
        web3 = rpcweb3;
    }
    else if (value.webtype == 'ws') {
        var wscweb3 = new Web3(new Web3.providers.WebsocketProvider(weburl));
        web3 = wscweb3;
    }
    else {
        return false;
    }
    chainid = Number(value.chainid.toString())
    nownetwork = value.nownetwork;
    return true;
}

//用私钥将交易内容签名
var EthereumTx = require('ethereumjs-tx');
const util = require('ethereumjs-util');
const { send } = require('process');
//这里是加载私钥的部分



function getPriKey(prikeystring) {
    prikeystring = prikeystring.replace("0x", "")
    const privKey = new Buffer.from(prikeystring, "hex");
    return privKey;
}


//通过小数点多少位，转换对应的数据
function getweiname(tokendecimals = 18) {
    tokendecimals = Number(tokendecimals.toString())
    weiname = 'ether';

    switch (tokendecimals) {
        case 3:
            weiname = "Kwei";
            break;
        case 6:
            weiname = 'mwei';
            break;
        case 9:
            weiname = 'gwei';
            break;
        case 12:
            weiname = 'microether ';
            break;
        case 15:
            weiname = 'milliether';
            break;
        case 18:
            weiname = 'ether';
            break;
        default:
            weiname = 'ether';
            break;

    }
    return weiname;
}

//这里是将交易用私钥签名部分
function getEthRawTx(fromAddress, toAddress, input, nonceNum, privKey, gasPrice, nbnb, gaslimit) {

    var rawTransaction = {
        "from": fromAddress,
        "nonce": web3.utils.toHex(nonceNum),
        "gasLimit": web3.utils.toHex(gaslimit),
        "gasPrice": web3.utils.toHex(gasPrice),
        "to": toAddress,
        "value": web3.utils.toHex(nbnb),
        "data": input,  //设置num属性
        "chainId": chainid //4:Rinkeby, 3:Ropsten, 1:mainnet

    };

    var tx = new EthereumTx(rawTransaction);
    tx.sign(privKey);
    var serializedTx = tx.serialize();
    return serializedTx;
}


//这里是将签名的内容发送到区块链网络中的代码
const signTransaction = async (fromAddress, toAddress, input, nonceNum, privKey, gasPrice, nbnb, gaslimit) => {
    var serializedTx = getEthRawTx(fromAddress, toAddress, input, nonceNum, privKey, gasPrice, nbnb, gaslimit)

    // Comment out these three lines if you don't really want to send the TX right now
    console.log(`Attempting to send signed tx:  ${serializedTx.toString('hex')}`);
    var receipt = await web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'));
    console.log(`Receipt info:  ${JSON.stringify(receipt, null, '\t')}`);
    if (receipt.status == true) {
        return true;
    }
    return false;
}

const getBNBBalance = async (address) => {
    let result = await web3.eth.getBalance(address)
    //由于使用的是大数模式，小数点有18位，所以获得的balance 要除以10^18次方才是正确的数据
    //或者使用自带的转换工具
    //原始区块链数据中存的BNB的数量是

    let balance = web3.utils.fromWei(result.toString(10), getweiname());
    return balance;
}
//私钥，合约地址，inputdata，主币数量，gas费，最大gasuse
const execjiaohu = async (priKey, walletaddress, inputdata, value, gas, ngasLimit) => {
    //获得自己的地址
    var fromAddress = "0x" + util.privateToAddress(priKey).toString('hex');


    var toAddress = walletaddress

    var nsendETH = value
    //假设交易 0.008个bnb
    var nbnb = web3.utils.toWei((nsendETH).toString(10), 'ether');
    //设置gasprice 为 5G wei
    var gasPrice = web3.utils.toWei((gas).toString(10), 'Gwei');
    //设置 gaslimit 为 420000
    var gaslimit = ngasLimit
    //没有调用智能合约，将input设置为空
    var input = inputdata
    //获得下一次交易的数
    console.log("发送地址是：" + fromAddress)
    var nonceCnt = await web3.eth.getTransactionCount(fromAddress);
    let reslut = await signTransaction(fromAddress, toAddress, input, nonceCnt, priKey, gasPrice, nbnb, gaslimit)
    if (reslut) {
        //console.log("交易成功")
        sendmsg(fromAddress + "交易成功");
        return true;
    }
    else {
        //console.log("交易失败")
        sendmsg(fromAddress + "交易失败");
        return false;
    }
}

function getNowMilliSecond() {
    return Math.floor(Date.now());
}

const testbalance = async (i, priKey) => {

    i = i + 1
    try {
        var fromAddress = "0x" + util.privateToAddress(priKey).toString('hex');
    }
    catch (e) {
        return;
    }

    //console.log("地址：" + fromAddress)
    var balance = await getBNBBalance(fromAddress);
    //if (Number(balance) > 0) 
    {
        msg = ("时间" + getNowMilliSecond() + "|第" + i + "个" + "地址:" + fromAddress + "有" + balance + "个" + nownetwork);
        sendmsg(msg);
    }



}

const getnonce = async (address) => {
    var nonceCnt = await web3.eth.getTransactionCount(address);
    //console.log("下一次交易数" + nonceCnt);
    return nonceCnt;
}


function test() {
    //var prikeyint = BigInt(0xaba9a9f7df9d19a5339073a9b5f2976d69b756dac39826a166353307d853cc80n); //这里填自己的私钥
    //启动程序
    /*for (var i = 0; i < 10; i++) {

       // main(i, prikeyint.toString(16))
       console.log(prikeyint.toString(16));
        prikeyint = prikeyint + 1n;
    }*/
    var i = 0;
    for (priKey of priKeys) {
        testbalance(i, priKey);
        i++;
    }
}

function qianggou(value) {
    var gas = value.gas;
    var gaslimit = value.gaslimit;
    var inputdata = value.inputdata;
    var nftaddress = value.nftaddress;
    var neth = value.neth;
    for (priKey of priKeys) {
        execjiaohu(priKey, nftaddress, inputdata, neth, gas, gaslimit);
        //break;
    }

}


function sendmsg(msg) {
    if (mainWindow != null) {
        mainWindow.webContents.send("info:msg", { msg });
    }
}

function setmainWindow(newmainWindow) {
    mainWindow = newmainWindow;
}

function abishiyong(value) {
    //return;
    abi = value.useabi;
    var gas = value.gas;
    var gaslimit = value.gaslimit;
    var nftaddress = value.nftaddress;
    var neth = value.neth;
    for (priKey of priKeys) {
        okvalue = value.okvalue;
        // 创建abi二进制
        // 如果要填自己的地址 ,默认通配符是 myaddress
        address = "0x" + util.privateToAddress(priKey).toString('hex');
        for (var i = 0; i < okvalue.length; i++) {
            try {
                okvalue[i] = okvalue[i].replace("myaddress", address)
            }
            catch (e) {
                ;
            }
        }
        var inputdata = web3.eth.abi.encodeFunctionCall(abi, okvalue);
        execjiaohu(priKey, nftaddress, inputdata, neth, gas, gaslimit);
        //break;
    }
}

function approvetokeninput(approveaddress)
{
    approveabi = getAbi(erc20abi,"approve");
    if (approveabi[0] == false)
        return [false, ""];

    var spend = approveaddress;
    var values = "999999999999"
    value = web3.utils.toWei(values.toString(10), "ether");

    var input = web3.eth.abi.encodeFunctionCall(approveabi[1], [spend, value]);
    //console.log(input)
    return [true, input];
}

const approvetoken = async(priKey,tokenaddress,approveaddress,gas,gasLimit)=>
{
    neth = 0;
    inputdata = approvetokeninput(approveaddress);
    
    if(inputdata[0]==true)
    {
        return await execjiaohu(priKey, tokenaddress, inputdata[1], neth, gas, gasLimit);
    }
    else
    {
        return false;
    }
}

const isapprove = async (priKey,tokenaddress,approveaddress,ownaddress,gas,gasLimit) =>
{
    tokenContract = new web3.eth.Contract(erc20, tokenaddress);
    let tokenname = await tokenContract.methods.symbol().call();
    let approvenumbers =   await tokenContract.methods.allowance(ownaddress,approveaddress).call();
    let decimals = await tokenContract.methods.decimals().call();
    weiname = getweiname(decimals);
    userbalance =  web3.utils.fromWei(approvenumbers.toString(10), weiname);
    if(approvenumbers <1000000)
    {
        //需要无限授权
        var result = await approvetoken(priKey,tokenaddress,approveaddress,gas,gasLimit)
        if(result)
        {
            var msg = "地址：" + ownaddress + "对代币:" + tokenname +"授权pancake成功";
            sendmsg(msg);
        }
    }
    else
    {
        var msg = "地址：" + ownaddress + "已经有代币:" + tokenname +"对pancake的授权";
        sendmsg(msg);
    }

}


const checkapprove = async (value) =>
{
    tokenaddress = value.tokenaddresscheck;
    approveaddress = value.approveaddress;
    gas = value.approvegas;
    gaslimit = value.approvegaslimit;
    
    for (priKey of priKeys) {
        var fromAddress = "0x" + util.privateToAddress(priKey).toString('hex');
       await isapprove(priKey, tokenaddress, approveaddress, fromAddress, gas, gaslimit);
        //break;
    }

}

function transnum(stringnumber,decimals)
{
    var length = stringnumber.length;
    if(length>decimals)
    {
        stringfirst = stringnumber.substring(0,length-decimals);
        stringse = stringnumber.substring(length-decimals,length);
        return stringfirst + "." + stringse;
    }
    else
    {
        var tmp = "0."
        for(var i=0;i<length-decimals;i++)
        {
            tmp +="0";
        }
        return tmp + stringnumber
    }
}



const getTokenBalance = async (tokenaddress, address) => {
    //创建代币的智能合约函数
    var tokenContract = new web3.eth.Contract(erc20, tokenaddress);


    //调用代币的智能合约获取余额功能
   let result = await tokenContract.methods.balanceOf(address).call();

    //获得代币有多少位小数
    let decimals = await tokenContract.methods.decimals().call();
    //weiname = getweiname(decimals);
    //let tokenbalance = web3.utils.fromWei(result.toString(10), weiname);
    let tokenbalance = transnum(result,decimals);
    //获得代币的符号
    let symbol = await tokenContract.methods.symbol().call();

    //打印结果
    //console.log("地址:" + address + "有代币:" + symbol + "的数量是:" + tokenbalance);
    return tokenbalance;
}


const gettokenname = async(tokenaddress) =>
{
    var tokenContract = new web3.eth.Contract(erc20, tokenaddress);
    let symbol = await tokenContract.methods.symbol().call();
    return symbol;
}

const getprice = async(lpaddress,usdcaddress,tokenaddress) =>
{
    
    let tokennum = await getTokenBalance(tokenaddress, lpaddress);
    let usdc = await getTokenBalance(usdcaddress, lpaddress);
    let ps =   usdc/tokennum;

    let bili = ps.toFixed(2);
    return bili;
    //console.log("1WBNB 可以交换多少个safemoon:" +bili)
}

function pancakefunc(functionname,values)
{
    approveabi = getAbi(pancakeabi,functionname);
    if (approveabi[0] == false)
        return [false, ""];

    var input = web3.eth.abi.encodeFunctionCall(approveabi[1], values);
    //console.log(input)
    return [true, input];
}

function createbuyinputdata(amountOut,amountInMax,path,to,deadline)
{
    var functionname = "swapTokensForExactTokens";
    var zhi = [amountOut,amountInMax,path,to,deadline];
    var input = pancakefunc(functionname,zhi);
    return  input;
}

function createsellinputdata( amountIn,  amountOutMin, path,  to,  deadline)
{
    var functionname = "swapExactTokensForTokens";
    var zhi = [amountIn,amountOutMin,path,to,deadline];
    var input = pancakefunc(functionname,zhi);
    return input;
}

//将代币数量从小数点转化为真实数据

const getturenumber = async(tokenaddress,number)=>
{
    var tokenContract = new web3.eth.Contract(erc20, tokenaddress);
    //获得代币有多少位小数
    let decimals = await tokenContract.methods.decimals().call();
    //将number 转为string
    var strnumber = number.toString(10);
    
    //获取小数点后面有几位小数
    var dotpos = strnumber.indexOf(".");
    if(dotpos!=-1)
    {
        var tmplength =strnumber.length - dotpos-1;
        if(tmplength < decimals)
        {
            strnumber = strnumber.replace(".","");
            for(var i=0;i<decimals-tmplength;i++)
            {
                strnumber += "0";
            }
        }
        else
        {
            var removenumber = tmplength - decimals;
            strnumber = strnumber.substring(0,strnumber.length-removenumber);
            strnumber = strnumber.replace(".","");
        }
        if(dotpos==1)
        {
            strnumber = strnumber.substring(1,strnumber.length);
        }
    }
    else
    {
        for(var i=0;i<decimals;i++)
            {
                strnumber += "0";
            }
    }
    return strnumber;

}

const buytoken = async(prikey,buyinfo,tokeninfo) =>
{
    lpaddress = tokeninfo.lpaddress;
    tokenaddress = tokeninfo.lptokenaddress;
    usdcaddress = tokeninfo.lptoken1address;
    tokensymbol = await gettokenname(tokenaddress);
    usdcsymbot = await gettokenname(usdcaddress);
    var fromAddress = "0x" + util.privateToAddress(prikey).toString('hex');
    //获取自己有多少usdc，
    let usdcnumber = await getTokenBalance(tokeninfo.lptoken1address,fromAddress);
    usdcnumber = Number(usdcnumber);
    //买对应数量的代币需要花费多少 usdc
    let price = await getprice(lpaddress,usdcaddress,tokenaddress);
    let useusdcnumber = Number(price)*Number(buyinfo.buynumber);

    if(useusdcnumber>usdcnumber)
    {
        sendmsg("地址:" + fromAddress +"没有足够的代币用来购买");
        return false;
    }
    //创建inputdata
    let gettokennumber = Number(buyinfo.buynumber)*(1-buyinfo.buylose);
    let usdcstrnumber =  await getturenumber(usdcaddress,useusdcnumber)
    let buytokennumber = await getturenumber(tokenaddress,gettokennumber)

    const now = moment().unix()
    const DEADLINE = now + 60 * 20

    var deadline = (DEADLINE).toString(10);

    var inputdata = createbuyinputdata(buytokennumber,usdcstrnumber,[usdcaddress,tokenaddress],fromAddress,deadline);
    if(inputdata[0])
    {
        let result = await execjiaohu(prikey,buyinfo.pancakeaddress,inputdata[1],0,buyinfo.buygas,buyinfo.buygaslimit);
        if(result)
        {
            //钱包 xx 购买代币成功
            sendmsg("地址：" + fromAddress + "以价格："+price +usdcsymbot+"购买"+gettokennumber +tokensymbol  +"成功!" );
        }
        else
        {
            sendmsg("地址：" + fromAddress + "购买代币" +tokensymbol  +"失败！" );
        }
    }
    else{
        sendmsg("地址：" + fromAddress + "创建inputdata 失败！" );
    }


}

function findquanxian(address,quanxian)
{
    var result = false;
  
    walletconfig.forEach(element => {
        if(element.walletaddress.toLowerCase()==address.toLowerCase())
        {
            result = element[quanxian];
            return ;
        }
    });
    return result;
}

const buytokenall = async(buyinfo,tokeninfo) =>
{
    for (priKey of priKeys) {
        var fromAddress = "0x" + util.privateToAddress(priKey).toString('hex');
        if(findquanxian(fromAddress,"buy")==true)
        {
            await buytoken(priKey, buyinfo,tokeninfo);
        }
       
        //break;
    }
}

const selltoken = async(prikey,buyinfo,tokeninfo) =>
{
    var wbnbaddress = buyinfo.buywbnb;
    lpaddress = tokeninfo.lpaddress;
    tokenaddress = tokeninfo.lptokenaddress;
    usdcaddress = tokeninfo.lptoken1address;
    tokensymbol = await gettokenname(tokenaddress);
    usdcsymbot = await gettokenname(usdcaddress);
    var fromAddress = "0x" + util.privateToAddress(prikey).toString('hex');
    //获取自己有多少代币，
    let tokennumber = await getTokenBalance(tokeninfo.lptokenaddress,fromAddress);
    tokennumber = Number(tokennumber);
    //卖对应数量的代币可以获得多少 usdc
    let price = await getprice(lpaddress,usdcaddress,tokenaddress);
    let useusdcnumber = Number(price)*Number(buyinfo.sellnumber);

    if(buyinfo.sellnumber>tokennumber)
    {
        sendmsg("地址:" + fromAddress +"没有足够的代币用来出售");
        return false;
    }
    //创建inputdata
    let getusdcnumber = Number(useusdcnumber)*(1-buyinfo.selllose);
    let usdcstrnumber =  await getturenumber(usdcaddress,getusdcnumber)
    let selltokennumber = await getturenumber(tokenaddress,buyinfo.sellnumber)

    const now = moment().unix()
    const DEADLINE = now + 60 * 20

    var deadline = (DEADLINE).toString(10);

    //相比买入，这里path 要 wbnb
    var inputdata = createsellinputdata(selltokennumber,usdcstrnumber,[tokenaddress,wbnbaddress,usdcaddress],fromAddress,deadline);
    if(inputdata[0])
    {
        let result = await execjiaohu(prikey,buyinfo.pancakeaddress,inputdata[1],0,buyinfo.buygas,buyinfo.buygaslimit);
        if(result)
        {
            //钱包 xx 购买代币成功
            sendmsg("地址：" + fromAddress +"以价格："+price +usdcsymbot+ "卖出"+ buyinfo.sellnumber+tokensymbol  +"成功!"  );
        }
        else
        {
            sendmsg("地址：" + fromAddress + "卖出代币" +tokensymbol  +"失败！" );
        }
    }
    else{
        sendmsg("地址：" + fromAddress + "创建inputdata 失败！" );
    }


}

const selltokenall = async(buyinfo,tokeninfo) =>
{
    for (priKey of priKeys) {
        var fromAddress = "0x" + util.privateToAddress(priKey).toString('hex');
        if(findquanxian(fromAddress,"sell")==true)
        {
            await selltoken(priKey, buyinfo,tokeninfo);
        }
        //break;
    }
}

module.exports = {
    initWeb3: initWeb3,
    test: test,
    qianggou: qianggou,
    setmainWindow: setmainWindow,
    abishiyong: abishiyong,
    checkapprove:checkapprove,
    getprice:getprice,
    buytokenall:buytokenall,
    selltokenall:selltokenall,
    gettokenname:gettokenname,
    reload:reload
}

