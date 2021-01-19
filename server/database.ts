import { createPool } from 'mysql';
import { MongoClient } from 'mongodb';
import { promisify } from 'util';

export class Mysql{
    host = '127.0.0.1';//"192.168.1.238";
    user = 'root';
    password = 'Roger2019$%^';//'almsong';
    connectionLimit = 500;
    connection: any = null;
    query: any = null;
    connect() {
        this.connection = createPool({ host: this.host, user: this.user, password: this.password, connectionLimit: this.connectionLimit});
        this.connection.getConnection((err, connection) => {
            if (err) {
                if (err.code === 'PROTOCOL_CONNECTION_LOST') {
                    console.error('Database connection was closed.')
                }
                if (err.code === 'ER_CON_COUNT_ERROR') {
                    console.error('Database has too many connections.')
                }
                if (err.code === 'ECONNREFUSED') {
                    console.error('Database connection was refused.')
                }
            }
            if (connection) connection.release()
        })
        this.query = promisify(this.connection.query).bind(this.connection);;
        return this.connection;
    }
    insert :  (dbName, collName, docs) => {
    }
    async find (dbName, collName, qry, projection=null, rawsql=null): Promise<any> {
        if(!this.connection) {
            throw ('mysql not connected.');
        }
        return !rawsql ?
            await this.query(`select ${projection ? Object.keys(projection).join(',') : ' * '} from ${dbName}.${collName}  ${ Object.keys(qry).length != 0? ' where '+Object.keys(qry).map(e=>`${e}='${qry[e]}'`).join(' and ') : ''}`)
            : await this.query(rawsql);
    }
    update(dbName, collName, query, updateObject, options = {}) {
    }
    remove(dbName, collName, query) {
    }
    updates(dbName, collName, query, options) {
    }
    ensureIndex(dbName, collName, index, unique = {} ){
    }
};
export class Mongodb {
    uri = "mongodb://127.0.0.1:27017//wf?retryWrites=true&w=majority";
    //uri = "mongodb+srv://roger:3QsomC9OdSPRuIYS@cluster0.pt4pq.azure.mongodb.net/wf?retryWrites=true&w=majority";
    useNewUrlParser = true;
    useUnifiedTopology = true;
    connection : any = null;
    connect(): Promise<any> {
        const client = new MongoClient(this.uri , { useNewUrlParser: this.useNewUrlParser, useUnifiedTopology: this.useUnifiedTopology });
        return new Promise(function (resolve, reject) {
            client.connect(function (err) {
                if (err) {
                    reject(err);
                    client.close();
                } else {
                    resolve(client);
                }
            })
        })
    }
    async insert(dbName, collName, docs){
        this.connection = await this.connect();
        const db = this.connection.db(dbName);
        const collection = db.collection(collName);
        let self = this;
        return new Promise(function (resolve, reject) {
            collection.insertMany(docs, function (err, result) {
                if (err) {
                    reject(err);
                } else {
                    resolve(result.result.n);
                }
            });
        });
    }
    async find(dbName, collName, qry, projection=null, limit: number=null, skip:number=null, sort:{[key:string]:1|-1}, count:boolean=false): Promise<any> {
        this.connection = await this.connect();
        const db = this.connection.db(dbName);
        const collection = db.collection(collName);
        return new Promise(function (resolve, reject) {
            if(count == true){
                collection.find(qry).project(projection).count(function (err, docs) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(docs);
                    }
                })
                return;
            }
            let cursor;
            if(limit > 0 && skip >= 0){
                if(sort){
                    cursor = collection.find(qry).limit(limit).skip(skip).sort(sort).project(projection);
                }else{
                    cursor = collection.find(qry).limit(limit).skip(skip).project(projection);
                }
            }else {
                if(sort){
                    cursor = collection.find(qry).sort(sort).project(projection);
                }else{
                    cursor = collection.find(qry).project(projection);
                }
            }
            cursor.toArray(function (err, docs) {
                if (err) {
                    reject(err);
                } else {
                    resolve(docs);
                }
            })
        })
    }
    async update(dbName, collName, query, updateObject, options = {}) {
        this.connection = await this.connect();
        const db = this.connection.db(dbName);
        const collection = db.collection(collName);
        // Insert some documents
        return new Promise(function (resolve, reject) {
            collection.updateOne(query, updateObject, options,  function (err, result) {
                if (err) {
                    reject(err);
                } else {
                    resolve(JSON.parse(result).n );
                }
            });
        });
    }
    async updates(dbName, collName, query, options) {
        this.connection = await this.connect();
        const db = this.connection.db(dbName);
        const collection = db.collection(collName);
        // Insert some documents
        const t = query.map( p => { 
            return { 
                updateOne: {
                    filter: { _id: p._id || p.id },
                    update: { $set: Object.keys(p).filter(e=>e!='_id').reduce((a,e)=>{
                        a[e]= p[e];
                        return a;
                    }, {}) },
                    upsert: options.upsert || 'false'
                }
            }
        });
        return new Promise(function (resolve, reject) {
            collection.bulkWrite(
                t,
                (err, result) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                }
            )
        });
    }
    async remove(dbName, collName, query){
        this.connection = await this.connect();
        const db = this.connection.db(dbName);
        const collection = db.collection(collName);
        let self = this;
        return new Promise(function (resolve, reject) {
            collection.deleteMany(query, function (err, result) {
                if (err) {
                    reject(err);
                } else {
                    resolve(result.result.n);
                }
            });
        });
    }
    async ensureIndex(dbName, collName, index, unique = {} ){
        this.connection = await this.connect();
        const db = this.connection.db(dbName);
        const collection = db.collection(collName);
        return new Promise(function (resolve, reject) {
            collection.createIndex(index, unique , function (err, result) {
            /* collection.ensureIndex(index, unique , function (err, result) { */
                if (err) {
                    reject(err);
                } else {
                    resolve(result.result);
                }
            });
        });
    }
}