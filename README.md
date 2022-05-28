# BSC链上自动交易程序，带源代码

node.js编写，可以自己手动编译

**第一步配置私钥**

打开prikey.prikey ,将私钥填进去，每行填一个私钥

这个文件力的私钥一定要是新建的，私钥不能给任何人！！！！

这个文件力的私钥一定要是新建的，私钥不能给任何人！！！！

这个文件力的私钥一定要是新建的，私钥不能给任何人！！！！


**第二步配置买卖权限**

打开wallet.json

```bash
[
    {
        "walletaddress":"钱包地址1",
        "buy":"false",
        "sell":"false"
    },
    {
        "walletaddress":"钱包地址2",
        "buy":"false",
        "sell":"false"
    }
]
```

在 walletaddress的值里面填入私钥对应的钱包地址
buy 的值为true时代表有买的权限，false 代表关闭买权限
sell 的值为true时代表有卖的权限，false 代表关闭卖权限


**程序使用方法**
参考 img文件夹下的image.png