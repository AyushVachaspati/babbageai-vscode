type LRUCacheNode = {
    key: string;
    value: string,
    prev: number | undefined,
    next: number | undefined
};

// TODO: Need to make this thread safe since multiple calls to InlineCompletions might access simultaneously
export class LRUCache {
    private map: Map<string, number>;
    private linkedList: Array<LRUCacheNode>;
    private head: number | undefined;  // LRU element is at head
    private tail: number | undefined; //MRU element is at tail
    private readonly size: number;
    private numElements: number;

    constructor (size:number){
        if(size <= 0){
            throw new Error("Size should be Greater than zero");
        }
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
            this.set(node.key,node.value);
            return node.value;
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
        this.map.forEach((index:number, key:string) => {
            console.log(`Key: ${key}, index: ${index}`);
        });
        console.log();

        console.log("Linked List");
        console.log("-".repeat(100));
        let temp = this.head;
        while(temp!==undefined){
            let elem = this.linkedList.at(temp);
            if(elem===undefined){
                throw new Error(`Trying to access index $temp, size of array ${this.linkedList.length}`)
            }
            console.log(`Key: ${elem.key}`,`Result: ${elem.value}, Next: ${elem.next}, Prev: ${elem.prev}`);
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
        let index = this.map.get(key)!;
        let currentNode = this.linkedList.at(index)!;
        
        if(index === this.tail){    
            currentNode.key = key;
            currentNode.value = value;
            return;
        } //already MRU, i.e. the tail.
        
        if(index === this.head){
            //key at head
            this.head = currentNode.next;
            let nextLRUNode = this.head!==undefined ? this.linkedList.at(this.head) : undefined;
            nextLRUNode !== undefined ? nextLRUNode.prev = undefined : undefined;    
        }
        else{
            //key in the middle of list
            let nextNode = currentNode.next!==undefined ? this.linkedList.at(currentNode.next) : undefined;
            let prevNode = currentNode.prev!==undefined ? this.linkedList.at(currentNode.prev) : undefined;
            prevNode!.next = currentNode.next;
            nextNode!.prev = currentNode.prev;
        }
        
        let currentMRUNode = this.tail!== undefined ? this.linkedList.at(this.tail) : undefined;
        currentMRUNode!==undefined ? currentMRUNode.next=index : undefined;
        currentNode.prev = this.tail;
        currentNode.next = undefined;
        currentNode.key = key;
        currentNode.value = value;
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
            value: value,
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
        let currentLRUIndex = this.head!;
        let currentMRUIndex = this.tail!;
        let currentLRUNode = currentLRUIndex!==undefined ? this.linkedList.at(currentLRUIndex) : undefined;
        let currentMRUNode = currentMRUIndex!==undefined ? this.linkedList.at(currentMRUIndex) : undefined;
        
        //case when cache size is 1
        if(currentLRUIndex===currentMRUIndex){
            this.map.delete(currentLRUNode!.key);
            this.map.set(key,currentLRUIndex);
            currentLRUNode!.value = value;
            currentLRUNode!.key = key;
            return;
        }

        this.head = currentLRUNode!.next!==undefined ? currentLRUNode!.next : undefined;
        let nextLRUNode = this.linkedList.at(this.head!);
        nextLRUNode !== undefined ? nextLRUNode.prev = undefined : undefined;
        
        let newMRUIndex = currentLRUIndex;
        let newMRUNode = currentLRUNode;
        this.map.delete(currentLRUNode!.key);
        this.map.set(key,newMRUIndex);
        currentMRUNode!.next  = newMRUIndex;
        newMRUNode!.next = undefined;
        this.tail = newMRUIndex;
        newMRUNode!.prev = currentMRUIndex;
        newMRUNode!.value = value;
        newMRUNode!.key = key;
    }


/************************************************************************************************************************************************************************************************/

    private getLRUElement(){
        return  this.head!==undefined? this.linkedList.at(this.head)?.value : undefined;
    }

/************************************************************************************************************************************************************************************************/

    private getMRUElement(){
        return  this.tail!==undefined? this.linkedList.at(this.tail)?.value : undefined;
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

// Tested using https://leetcode.com/problems/lru-cache