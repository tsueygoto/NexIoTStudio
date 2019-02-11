var NodeRSA = require('node-rsa');

//var key = new NodeRSA({b: 2048});
//console.log(key);


//var privatekey = key.exportKey('pkcs1-private-pem');

//console.log(privatekey);

//var aaa = key.generateKeyPair(2048, 65537);

//console.info(aaa);

//console.info(key.exportkKey('pkcs8-public-pem'));


//var privatekey = aaa.exportKey('pkcs8-private-pem');
//var publickey = aaa.exportKey('pkcs8-public-pem');
//
//console.log(privatekey);
//console.log(publickey);

// import private key


var privateKey = new NodeRSA('-----BEGIN PRIVATE KEY-----\n'+
'MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCKWrsPQpj3rwiv\n'+
'PyVX7jkbapRtkZ7mJZEqRWC5SYeXPDZxh7HEvVOdIePIWkGWh6g/BRXrqz/cIfxn\n'+
'ODIdm6Iojsxqo4BIFFmaD+WEwgkSA8lf3NoOAcTUKbJcHNcg1CQOp/cSDi0qj7Wv\n'+
'wwkJbv1aeve5qMls0jsNkMGf3mXTtTm/9lozoU+hUw0YsfiHc3pPCnETfQgj27Xm\n'+
'vFLQq0zCQWBggy1grrp11P07BwglIU96Keb63cAwioVosrcgNfrBf1GYeuZCGImN\n'+
'EeiyeYMa2IzN4jGMbD7XnMcvQIuH8DD1DPV/f/flIJl4rveS9KRWV68f6+KGFxVK\n'+
'1ArFKbZtAgMBAAECggEAD2NB9NOKYdnU1HDofVwge90hvwH4M06wU4w90r3L19U5\n'+
'lOzrp58LAqn3RJxNOSnDW6b8Jib4xkn9YZmNcV+S7IHdWGrw5JNm18y20UonahqD\n'+
'tibBFde6hYJRtQ78Gkmd7QdfYmGzQk2TfoXppmPyx7JvhPWx2WmUadDUyCwbFS2j\n'+
'7iV6YgTl0QTXroneIo6bFY/OczcmnfFiNDJLRsiJScEKrMK3Mhqa8CimEsprtkvf\n'+
'0XjaP6yqJEOlIZim43u40V6tjdfn3ZsxPvNuUvmIw6gNp0qgvSdf6TJ7LOaNyQB6\n'+
'V2Mt+dSVupdgUtmTCyilk06s2l+vCsVEaLOHFOpBQQKBgQC9+jbRrtA699zA8dg4\n'+
'RTZC8Mm586KRoTUXz3Z6etsYLMwymfb5WQr1vx8ZT2bgOA10plNEj9vQYMFRb4XT\n'+
'kEDhChk/TG7CYB8stAQ6hvgTMYdla09PIDAFee1i78jLkeR0HNSvXZGMVyGrL4gF\n'+
'oPsUGe3CTmQEC/LH0Ck2XZFB/QKBgQC6b8GxNQLRg0MQ2noydWuN1MqaAgyfSHRj\n'+
'hexE0pI2rk/mYXRbej91zd66djKGPK1d0XYzanLby4I1cKGCllz6oXcto2nRtzqx\n'+
'lz9MGMF5AEr2Kvd4nBEOvlxQ/OwVQGN+eUSxtYblzl6jwAqtFNx+AnRiuCd7NUIC\n'+
'Ugi3hPH5MQKBgQCoY+K3VUZJHm5Tr4pBxkdkal3EL0oH32ZaJpAT3FXbRcnxiDs7\n'+
'pUtrq+561sCPOd/jZ5IjEYh7WWfBMSLj9dcsIXFjg/Ig5GZ9j0q4Pe4hxSMIKGfx\n'+
'8Mvf7sUVjwjiN/zRVsTGdB+Qz6KOQ+FDa/9hP+JY+nb4h0a5Ca+d+q3IWQKBgGPe\n'+
'LaFhRis45xoGDmMtJvoIvKaW5nAEfeQ5/wA20//ajA5asdu2tnvCVccIPbROmIej\n'+
'BnAwW2qFrzA1Ly8moJPZHmAiIzMltZkf7dYzhJ/umjkXdwzyfOiq7ASuF0CjByje\n'+
'iP+wv5wmWefZnV5tyFbvtayT/QIw2zUnAGheHMhhAoGAcEy5VnRONCde0v1aSxc2\n'+
'b6VUxrmCEK96PIaYmnHA1im4FsTetO3bJznbCYV7NfDnoc+5U1K/B7S1SCPIHlw3\n'+
'4LwWMMVOh1l6dZ+4mibY98KPuEmVA+9obvHkTtMX33BvK+RYQL5PpRfDU9EFI7mM\n'+
'OEyAj7dLMH7/ftddvezasxw=\n'+
'-----END PRIVATE KEY-----')

var publicKey = new NodeRSA('-----BEGIN PUBLIC KEY-----\n'+
'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAilq7D0KY968Irz8lV+45\n'+
'G2qUbZGe5iWRKkVguUmHlzw2cYexxL1TnSHjyFpBloeoPwUV66s/3CH8ZzgyHZui\n'+
'KI7MaqOASBRZmg/lhMIJEgPJX9zaDgHE1CmyXBzXINQkDqf3Eg4tKo+1r8MJCW79\n'+
'Wnr3uajJbNI7DZDBn95l07U5v/ZaM6FPoVMNGLH4h3N6TwpxE30II9u15rxS0KtM\n'+
'wkFgYIMtYK66ddT9OwcIJSFPeinm+t3AMIqFaLK3IDX6wX9RmHrmQhiJjRHosnmD\n'+
'GtiMzeIxjGw+15zHL0CLh/Aw9Qz1f3/35SCZeK73kvSkVlevH+vihhcVStQKxSm2\n'+
'bQIDAQAB\n'+
'-----END PUBLIC KEY-----');


var out = privateKey.encryptPrivate("This is a test BaBaBa ... \n <>");
console.log(out);

var data = publicKey.decryptPublic(out);
console.log(data.toString('utf8'));



