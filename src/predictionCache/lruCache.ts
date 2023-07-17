import assert = require("assert");

type LRUCacheNode = {
    key: string;
    result: string,
    prev: number | undefined,
    next: number | undefined
};

export class LRUCache {
    map: Map<string, number>;
    linkedList: Array<LRUCacheNode>;
    head: number | undefined;  // LRU element is at head
    tail: number | undefined; //MRU element is at tail
    readonly size: number;
    numElements: number;

    constructor (size:number){
        assert(size>0,"Trying to Initialize cache with 0 size. Min size is 1.");
        this.map = new Map<string, number> ();
        this.linkedList = new Array<LRUCacheNode> (size);
        this.head = undefined;
        this.tail = undefined;
        this.numElements = 0;
        this.size = size;
    }

/************************************************************************************************************************************************************************************************/

    get(key: string){
        let index = this.map.get(key);
        let node =  index !== undefined ? this.linkedList.at(index) : undefined;
        if(node!==undefined){
            this.set(node.key,node.result);
            return node.result;
        }
        else{
            return undefined;
        }
    }

/************************************************************************************************************************************************************************************************/

    set(key: string, value: string){
        if(this.map.get(key)!==undefined){
            this.moveElementToMRU(key,value);
        }
        else{
            if(this.isFull()){
                this.replaceLRUElement(key,value);
            }
            else{
                this.addElementToEnd(key,value);
            }
        }
    }

/************************************************************************************************************************************************************************************************/

    clearCache(){
        this.map.clear();
        this.head = undefined;
        this.tail = undefined;
        this.numElements = 0;
        this.linkedList.length = 0; //delete all items
        this.linkedList.length = this.size; //reset length of array to size
    }

/************************************************************************************************************************************************************************************************/

    printCache(){
        console.log("MAP");
        console.log("-".repeat(100));
        this.map.forEach((value:number, key:string) => {
            console.log(`Key: ${key}, value: ${value}`);
        });
        console.log();

        console.log("Linked List");
        console.log("-".repeat(100));
        let temp = this.head;
        while(temp!==undefined){
            let elem = this.linkedList.at(temp);
            assert(elem!==undefined, "Accessed Out of bound element in Array");
            console.log(`Key: ${elem.key}`,`Result: ${elem.result}, Next: ${elem.next}, Prev: ${elem.prev}`);
            temp = elem.next;
       }
       console.log();

       console.log("Array State");
       console.log("-".repeat(100));
       console.log(this.linkedList);
       console.log();

       console.log(`LRU: ${this.getLRUElement()}`);
       console.log(`MRU: ${this.getMRUElement()}`);
    }


/************************************************************************************************************************************************************************************************/

    private moveElementToMRU(key: string, value: string){
        let index = this.map.get(key);
        assert(index!==undefined, "Supposed to be called when Index already present.");
        let currentNode = this.linkedList.at(index);
        assert(currentNode!==undefined, "Expected a LRUCacheNode here.");
        
        if(index === this.tail){return;} //already MRU, i.e. the tail.
        
        if(index === this.head){
            //key at head
            this.head = currentNode.next;
            let nextLRUNode = this.head!==undefined ? this.linkedList.at(this.head) : undefined;
            nextLRUNode !== undefined ? nextLRUNode.prev = undefined : undefined;    
        }
        else{
            //key in the middle of list
            let nextNode = currentNode.next ? this.linkedList.at(currentNode.next) : undefined;
            let prevNode = currentNode.prev ? this.linkedList.at(currentNode.prev) : undefined;
            assert(nextNode!==undefined && prevNode!==undefined, "Expected Current Node to be Middle Node");
            prevNode.next = currentNode.next;
            nextNode.prev = currentNode.prev;
        }
        
        let currentMRUNode = this.tail!== undefined ? this.linkedList.at(this.tail) : undefined;
        currentMRUNode!==undefined ? currentMRUNode.next=index : undefined;
        currentNode.prev = this.tail;
        currentNode.next = undefined;
        currentNode.key = key;
        currentNode.result = value;
        this.tail = index;
    }

/************************************************************************************************************************************************************************************************/

    private addElementToEnd(key:string, value: string){
        let newIndex = this.numElements;
        let prevNode = this.tail!==undefined? this.linkedList.at(this.tail) : undefined;
        if(prevNode!==undefined){
            prevNode.next = newIndex;
        }
        this.linkedList[newIndex] = {
            key: key,
            result: value,
            prev: this.tail,  // prev is the last MRU
            next: undefined
        };
        if(this.isEmpty()){this.head = newIndex;}
        this.map.set(key,newIndex);
        this.tail = newIndex; // new element is MRU
        this.numElements += 1;
    }

/************************************************************************************************************************************************************************************************/

    private replaceLRUElement(key:string, value: string){
        let currentLRUIndex = this.head;
        let currentMRUIndex = this.tail;
        let currentLRUNode = currentLRUIndex!==undefined ? this.linkedList.at(currentLRUIndex) : undefined;
        let currentMRUNode = currentMRUIndex!==undefined ? this.linkedList.at(currentMRUIndex) : undefined;
        assert((currentLRUNode!==undefined && currentMRUNode!==undefined 
                && currentLRUIndex!==undefined && currentMRUIndex!==undefined), "No Element even though cache is full.");
        
        //case when cache size is 1
        if(currentLRUIndex===currentMRUIndex){
            this.map.delete(currentLRUNode.key);
            this.map.set(key,currentLRUIndex);
            currentLRUNode.result = value;
            currentLRUNode.key = key;
            return;
        }

        this.head = currentLRUNode.next!==undefined ? currentLRUNode.next : undefined;
        assert(this.head!==undefined, "No Head Element for Linked List");
        let nextLRUNode = this.linkedList.at(this.head);
        nextLRUNode !== undefined ? nextLRUNode.prev = undefined : undefined;
        
        let newMRUIndex = currentLRUIndex;
        let newMRUNode = currentLRUNode;
        this.map.delete(currentLRUNode.key);
        this.map.set(key,newMRUIndex);
        currentMRUNode.next  = newMRUIndex;
        newMRUNode.next = undefined;
        this.tail = newMRUIndex;
        newMRUNode.prev = currentMRUIndex;
        newMRUNode.result = value;
        newMRUNode.key = key;
    }


/************************************************************************************************************************************************************************************************/

    private getLRUElement(){
        return  this.head!==undefined? this.linkedList.at(this.head)?.result : undefined;
    }

/************************************************************************************************************************************************************************************************/

    private getMRUElement(){
        return  this.tail!==undefined? this.linkedList.at(this.tail)?.result : undefined;
    }

/************************************************************************************************************************************************************************************************/       

    private isEmpty(){
        return this.numElements === 0;
    }

/************************************************************************************************************************************************************************************************/

    private isFull(){
        return this.numElements === this.size;
    }

/************************************************************************************************************************************************************************************************/

}

// async function test1213(){
// let test  = new LRUCache(10);
//     for (let index = 0; index < 20; index++) {
//         test.set(`Key${index}`,`Value${index}`);
//         test.printCache()
//         await new Promise(f => setTimeout(f,1000));
    
//     }
//     test.get("Key10");
//     test.printCache();
//     await new Promise(f => setTimeout(f,1000));
//     test.set("Key12","ASDF");
//     test.printCache();
// }
// test1213();