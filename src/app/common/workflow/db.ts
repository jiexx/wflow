

class DB {
    configuration: {mysql: {[key:string]: any}, mongodb:{[key:string]: any}} = {mysql:{}, mongodb:{}};
    dbtype: string = 'mongodb';
    config(mysql: {[key:string]: any}, mongodb:{[key:string]: any}){
        this.configuration.mysql = mysql;
        this.configuration.mongodb = mongodb;
    }
    async insert(dbName, collName, docs) {
        return await this.configuration[this.dbtype].insert(dbName, collName, docs);
    }
    async find(dbName, collName, qry, projection=null, rawsql=null, skip=null, sort=null): Promise<any> {
        return await this.configuration[this.dbtype].find(dbName, collName, qry, projection, rawsql, skip, sort);
    }
    async update(dbName, collName, query, updateObject, options = {}) {
        return await this.configuration[this.dbtype].update(dbName, collName, query, updateObject, options);
    }
    async updates(dbName, collName, query, options) {
        return await this.configuration[this.dbtype].updates(dbName, collName, query, options);
    }
    async remove(dbName, collName, query){
        return await this.configuration[this.dbtype].remove(dbName, collName, query);
    }
    async ensureIndex (dbName, collName, index, unique = {} ) {
        return await this.configuration[this.dbtype].ensureIndex(dbName, collName, index, unique);
    }
    async connect(name: 'mysql' | 'mongodb') {
        this.dbtype = name;
        if(!this.configuration[this.dbtype].connection && name == 'mysql') {
            this.configuration[this.dbtype].connection = await this.configuration[this.dbtype].connect();
        }else if(name == 'mongodb') {
            this.configuration[this.dbtype].connection = await this.configuration[this.dbtype].connect();
        }
    }
}
export enum __dbName {
    PLANS = 'plans',
}
export enum __colName {
    WORKFLOWS = 'plans',
    MODELS = 'models',
    SCHEDULES = 'schedules',
    SOLUTIONS = 'solutions',
    ROLE$SCHED = 'role_sched',
    USERS = 'users',
    AVATARS = 'avatars',
    ROLES = 'roles',
    ARTICLES = 'articles',
    TAGS = 'tags'
}


export const __db = new DB();