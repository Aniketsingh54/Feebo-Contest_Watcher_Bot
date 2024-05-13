const fs = require("fs")


const savedata = (obj,rating,UID) =>{
  const finish = (error) => {
    if(error){
      console.error(error);
      return;
    }
  }
  const jsondata = JSON.stringify(obj,null,2);
  fs.writeFile("problems/"+rating+"/"+UID+'.json',jsondata,finish)
}

async function filter()
{
  const url = "https://codeforces.com/api/problemset.problems";
  const response = await fetch(url);
  const usrJSON = await response.json();
  const prob = usrJSON?.result?.problems;
  const probstat = usrJSON?.result?.problemStatistics;
  
  for(let i=0;i<prob.length;i++)
  {
    if(prob[i]?.rating!=undefined && prob[i].contestId>700)
    {
      const obj = new Object();
      obj.problem=prob[i];
      obj.problemStatistics=probstat[i];
      savedata(obj,prob[i].rating,i);
    }
  }
}
filter();