const fs=require('node:fs');const path=require('node:path');
class EvidenceReporter {
 onBegin(){this.tests=[];}
 onTestEnd(test,result){this.tests.push({title:test.titlePath(),status:result.status,expectedStatus:test.expectedStatus,durationMs:result.duration,retry:result.retry,errors:result.errors.map(e=>e.message)});}
 onEnd(result){const out=process.env.TEST_EVIDENCE_PATH;if(out){fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify({runStatus:result.status,tests:this.tests},null,2));}}
}
module.exports=EvidenceReporter;
