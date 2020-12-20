
export const arrayEqual = (array1:[], array2:[]) => {
    return array1 && array2 && array1.length === array2.length && array1.every((value, index) => value === array2[index]);
}
const __trace = function(){
    //console.trace();
    // if(typeof process === 'object'){
    //     if(process.release.name === 'node'){
    //         let e = new Error();
    //         let frame = e.stack.split("\n")[3].match(/(at ([^\()]+?)\((.*):([0-9]+:[0-9]+))|(at (.*):([0-9]+:[0-9]+))/);
    //         let lineNumber = frame[4] || frame[7];
    //         let fileName = (frame[3] || frame[6]) ;
    //         fileName = fileName.match(/.*(\/|\\)(.*)/)[2]
    //         let functionName = frame[2] || '';
    //         return ' at '+fileName+':'+lineNumber+' => '+ functionName;
    //     }
    // }
    return '';
}
export const __debug = (...args: any[]) => {
    if(1){
        let str = args.reduce((p,c)=>p+=c, '');
        console.log(new Date().toLocaleString(),  str, __trace());
    }
};