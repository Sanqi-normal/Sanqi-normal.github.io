async function getFileSHA() {
    //console.log('sha get');
    const response = await fetch('https://api.github.com/repos/sanqiData/DataSave/contents/ipset');
    const fileData = await response.json();
    return fileData.sha; 
}
async function updateFile(newContent, sha) {
    console.log('put start');
    const base64EncodedString = 'QmVhcmVyIGdpdGh1Yl9wYXRfMTFCTllQWUdRMG15N2xFNWoyenRKbF84ZTFhNTlCTG9lcVNIMUtxMVpXa2pMYXhhOWFjWDhOSzN3UWhacjBJZ2NiTEFPWURDVk9leVgxdjl0eg==';
    const decodedString = atob(base64EncodedString);
    const base64Content = btoa(unescape(encodeURIComponent(newContent)));
    const updateResponse = await fetch('https://api.github.com/repos/sanqiData/DataSave/contents/ipset', {
        method: 'PUT',
        headers: {
            'Authorization': decodedString, 
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            message: 'Update ipset.md to add new IP',
            content: base64Content, 
            sha: sha 
        })
    });

    if (updateResponse.ok) {
        //console.log('ip writedown');
    } else {
        //console.error('fail to wirte');
    }
}

async function getUserIP() {
    const ipAddresses = ['https://2024.ipchaxun.com/', 'https://api.ipify.org?format=json','https://www.ip.cn/api/index?ip&type=0']; 
    for (const ipAddress of ipAddresses) {
        try {
            const response = await fetch(ipAddress);
            const data = await response.json();
            return data.ip; 
        } catch (error) {
            //console.error(`fail to get ip `, error);
        }
    }
    return null; 
}

async function checkAndUpdateIP() {
   // console.log('get raw');
    const ip = await getUserIP();
    const response = await fetch('https://raw.githubusercontent.com/sanqiData/DataSave/master/ipset');
    let fileContent = await response.text();
const existingIPs = fileContent.split('\n');


if (existingIPs.some(existingIP => existingIP.trim() === ip)) {
  //  console.log('IP has already in');
  const existingIndex = existingIPs.findIndex(existingIP => existingIP.trim() === ip);
  const countLineIndex = existingIndex + 1;
  const count = parseInt(fileContent.split('\n')[countLineIndex]) || 0;
  fileContent = fileContent.replace(`\n${count}\n`, `\n${count + 1}\n`); 
}
else{fileContent += `\n${ip}\n1`; }
const fileSHA = await getFileSHA();
await updateFile(fileContent, fileSHA); 
}
checkAndUpdateIP();

