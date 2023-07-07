"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LRUCache = void 0;
var assert = require("assert");
var LRUCache = /** @class */ (function () {
    function LRUCache(size) {
        assert(size > 0, "Trying to Initialize cache with 0 size. Min size is 1.");
        this.map = new Map();
        this.linkedList = new Array(size);
        this.head = undefined;
        this.tail = undefined;
        this.numElements = 0;
        this.size = size;
    }
    /************************************************************************************************************************************************************************************************/
    LRUCache.prototype.get = function (key) {
        var index = this.map.get(key);
        var node = index !== undefined ? this.linkedList.at(index) : undefined;
        if (node !== undefined) {
            this.set(node.key, node.result);
            return node.result;
        }
        else {
            return undefined;
        }
    };
    /************************************************************************************************************************************************************************************************/
    LRUCache.prototype.set = function (key, value) {
        if (this.map.get(key) !== undefined) {
            this.moveToMRU(key, value);
        }
        else {
            if (this.isFull()) {
                this.replaceLRUElement(key, value);
            }
            else {
                this.addElementToEnd(key, value);
            }
        }
    };
    /************************************************************************************************************************************************************************************************/
    LRUCache.prototype.moveToMRU = function (key, value) {
        var index = this.map.get(key);
        assert(index !== undefined, "Supposed to be called when Index already present.");
        var currentNode = this.linkedList.at(index);
        assert(currentNode !== undefined, "Expected a LRUCacheNode here.");
        if (index === this.tail) {
            return;
        } //already MRU
        else if (index === this.head) {
            this.head = currentNode.next;
            var nextLRUNode = this.head !== undefined ? this.linkedList.at(this.head) : undefined;
            nextLRUNode !== undefined ? nextLRUNode.prev = undefined : undefined;
            var currentMRUNode = this.tail !== undefined ? this.linkedList.at(this.tail) : undefined;
            currentMRUNode !== undefined ? currentMRUNode.next = index : undefined;
            currentNode.prev = this.tail;
            currentNode.next = undefined;
            currentNode.key = key;
            currentNode.result = value;
            this.tail = index;
        }
        else {
            console.log("Element is in the Middle");
            var nextNode = currentNode.next ? this.linkedList.at(currentNode.next) : undefined;
            var prevNode = currentNode.prev ? this.linkedList.at(currentNode.prev) : undefined;
            assert(nextNode !== undefined && prevNode !== undefined, "Expected Current Node to be Middle Node");
            prevNode.next = currentNode.next;
            nextNode.prev = currentNode.prev;
            var currentMRUNode = this.tail !== undefined ? this.linkedList.at(this.tail) : undefined;
            currentMRUNode !== undefined ? currentMRUNode.next = index : undefined;
            currentNode.prev = this.tail;
            currentNode.next = undefined;
            currentNode.key = key;
            currentNode.result = value;
            this.tail = index;
        }
    };
    /************************************************************************************************************************************************************************************************/
    LRUCache.prototype.clearCache = function () {
        this.map.clear();
        this.head = undefined;
        this.tail = undefined;
        this.numElements = 0;
        this.linkedList.length = 0; //delete all items
        this.linkedList.length = this.size; //reset length of array to size
    };
    /************************************************************************************************************************************************************************************************/
    LRUCache.prototype.printCache = function () {
        console.log("MAP");
        console.log("-".repeat(100));
        this.map.forEach(function (value, key) {
            console.log("Key: ".concat(key, ", value: ").concat(value));
        });
        console.log();
        console.log("Linked List");
        console.log("-".repeat(100));
        var temp = this.head;
        while (temp !== undefined) {
            var elem = this.linkedList.at(temp);
            assert(elem !== undefined, "Accessed Out of bound element in Array");
            console.log("Key: ".concat(elem.key), "Result: ".concat(elem.result, ", Next: ").concat(elem.next, ", Prev: ").concat(elem.prev));
            temp = elem.next;
        }
        console.log();
        console.log("Array State");
        console.log("-".repeat(100));
        console.log(this.linkedList);
        console.log();
        console.log("LRU: ".concat(this.getLRUElement()));
        console.log("MRU: ".concat(this.getMRUElement()));
    };
    /************************************************************************************************************************************************************************************************/
    LRUCache.prototype.addElementToEnd = function (key, value) {
        var newIndex = this.numElements;
        var prevNode = this.tail !== undefined ? this.linkedList.at(this.tail) : undefined;
        if (prevNode !== undefined) {
            prevNode.next = newIndex;
        }
        this.linkedList[newIndex] = {
            key: key,
            result: value,
            prev: this.tail,
            next: undefined
        };
        if (this.isEmpty()) {
            this.head = newIndex;
        }
        this.map.set(key, newIndex);
        this.tail = newIndex; // new element is MRU
        this.numElements += 1;
    };
    /************************************************************************************************************************************************************************************************/
    LRUCache.prototype.replaceLRUElement = function (key, value) {
        var currentLRUIndex = this.head;
        var currentMRUIndex = this.tail;
        var currentLRUNode = currentLRUIndex !== undefined ? this.linkedList.at(currentLRUIndex) : undefined;
        var currentMRUNode = currentMRUIndex !== undefined ? this.linkedList.at(currentMRUIndex) : undefined;
        assert((currentLRUNode !== undefined && currentMRUNode !== undefined
            && currentLRUIndex !== undefined && currentMRUIndex !== undefined), "No Element even though cache is full.");
        //case when cache size is 1
        if (currentLRUIndex === currentMRUIndex) {
            this.map.delete(currentLRUNode.key);
            this.map.set(key, currentLRUIndex);
            currentLRUNode.result = value;
            currentLRUNode.key = key;
            return;
        }
        this.head = currentLRUNode.next !== undefined ? currentLRUNode.next : undefined; //setting LRU-2 to LRU, if only 1 element in cache then head is still head
        assert(this.head !== undefined, "No Head Element for Linked List");
        var nextLRUNode = this.linkedList.at(this.head);
        nextLRUNode !== undefined ? nextLRUNode.prev = undefined : undefined;
        var newMRUIndex = currentLRUIndex;
        var newMRUNode = currentLRUNode;
        this.map.delete(currentLRUNode.key);
        this.map.set(key, newMRUIndex);
        currentMRUNode.next = newMRUIndex;
        newMRUNode.next = undefined;
        this.tail = newMRUIndex;
        newMRUNode.prev = currentMRUIndex;
        newMRUNode.result = value;
        newMRUNode.key = key;
    };
    /************************************************************************************************************************************************************************************************/
    LRUCache.prototype.getLRUElement = function () {
        var _a;
        return this.head !== undefined ? (_a = this.linkedList.at(this.head)) === null || _a === void 0 ? void 0 : _a.result : undefined;
    };
    /************************************************************************************************************************************************************************************************/
    LRUCache.prototype.getMRUElement = function () {
        var _a;
        return this.tail !== undefined ? (_a = this.linkedList.at(this.tail)) === null || _a === void 0 ? void 0 : _a.result : undefined;
    };
    /************************************************************************************************************************************************************************************************/
    LRUCache.prototype.isEmpty = function () {
        return this.numElements === 0;
    };
    /************************************************************************************************************************************************************************************************/
    LRUCache.prototype.isFull = function () {
        return this.numElements === this.size;
    };
    return LRUCache;
}());
exports.LRUCache = LRUCache;
function t() {
    return __awaiter(this, void 0, void 0, function () {
        var test, index;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    test = new LRUCache(10);
                    index = 0;
                    _a.label = 1;
                case 1:
                    if (!(index < 10)) return [3 /*break*/, 4];
                    test.set("Key".concat(index), "test".concat(index));
                    console.log("FETCH", index, " :", test.get("Key".concat(index)), "################");
                    // test.printCache();
                    return [4 /*yield*/, new Promise(function (f) { return setTimeout(f, 10); })];
                case 2:
                    // test.printCache();
                    _a.sent();
                    _a.label = 3;
                case 3:
                    index++;
                    return [3 /*break*/, 1];
                case 4:
                    test.printCache();
                    test.get("Key123123");
                    test.printCache();
                    return [2 /*return*/];
            }
        });
    });
}
t();
