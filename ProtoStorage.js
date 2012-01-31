/**
 *  ProtoStorage.js – (With Prototype.js Class System)
 *
 *  @author Seraf Dos Santos <webmaster@cyb3r.ca>
 *  @copyright 2011-2012 Seraf Dos Santos - All rights reserved.
 *  @license MIT License
 *  @version 1.0
 */

//"use strict";





/**
 *  StorageException Class
 *
 *  For Storage exceptions.
 */
var StorageException = Class.create({
    
    initialize: function (message) {
        
        this.name = "StorageException";
        this.message = message;
    },
    toString: function () {
        
        return "["+this.name+"] "+this.message;
    }
});





/**
 *  AsyncSQLStatementsArray Class
 *
 *  Holds Asynchronous SQL statements in an Array.
 */
var AsyncSQLStatementsArray = Class.create({
    
    initialize: function () {
        
        this._sqlStmntsArray = new Array();
    },
    push: function (storageInstance, sql, params, statementCallback, errorCallback) {
        
        this._sqlStmntsArray.push(new Array(storageInstance, sql, (params.length > 0 ? params : null), statementCallback, errorCallback));
    },
    getArray: function () {
        
        return this._sqlStmntsArray;
    },
    getStatementByIndex: function (index) {
        
        return this._sqlStmntsArray[index];
    }
});





/**
 *  SyncSQLStatementsArray Class
 *
 *  Holds Synchronous SQL statements in an Array.
 */
var SyncSQLStatementsArray = Class.create({
    
    initialize: function () {
        
        this._sqlStmntsArray = new Array();
    },
    push: function (storageInstance, sql, params) {
        
        this._sqlStmntsArray.push(new Array(storageInstance, sql, (params.length > 0 ? params : null)));
    },
    getArray: function () {
        
        return this._sqlStmntsArray;
    },
    getStatementByIndex: function (index) {
        
        return this._sqlStmntsArray[index];
    }
});





/**
 *  ResultSet Class
 *
 *  Holds the fetched result set.
 */
var ResultSet = Class.create({
    
    initialize: function (resultSet) {
        
        this._resultSet = resultSet;
    },
    getLastInsertId: function () {

        if (this._resultSet != null) {

            return this._resultSet.insertId;
        }
    },
    getRowCount: function () {

        if (this._resultSet != null) {

            return this._resultSet.rows.length;
        }
        
        return null;
    },
    getRow: function (index) {

        if (this.getRowCount() > 0) {
            
            return this._resultSet.rows.item(index);
        }
        
        return null;
    }
});





/**
 *  StorageAsync Class
 *
 *  Core Asynchronous Database methods.
 */
var AsyncStorage = Class.create({
    
    initialize: function (dbName, dbVersion, dbDisplayName, dbSize, dbCallback) {
        
        this._lastResultSet = null;
        this._isSuccess = false;
        
        this._DB = null;
        
        this._dbName = dbName;
        this._dbVersion = dbVersion;
        this._dbDisplayName = dbDisplayName;
        this._dbSize = dbSize;
        this._dbCallback = dbCallback || this._dbq_onConnect;
        
        this._isConnected = false;
    },
    connect: function () {
        
        try {
            
            if (!window.openDatabase) {
                
                throw new StorageException('Web SQL Database not supported.');
            } else {
                
                this._DB = window.openDatabase(this._dbName, this._dbVersion, this._dbDisplayName, this._dbSize, this._dbCallback);
                
                this._isConnected = true;
            }
        } catch(e) {
            
            switch (e) {
                /*
                case UNKNOWN_ERR:
                    break;
                case DATABASE_ERR:
                    break;
                case VERSION_ERR:
                    break;
                case TOO_LARGE_ERR:
                    break;
                case QUOTA_ERR:
                    break;
                case SYNTAX_ERR:
                    break;
                case CONSTRAINT_ERR:
                    break;
                case TIMEOUT_ERR:
                    break;
                */
                case INVALID_STATE_ERR:
                    throw new StorageException('Invalid database version.');
                    break;
                default:
                    throw new StorageException('Unknown error '+e.message+'.');
            }
        }
        
        return this._isConnected;
    },
    _dbq_onConnect: function (database) {
        
        console.log("Database connected.");
    },
    getConn: function () {
        
        return this._DB;
    },
    isConnected: function () {
        
        return this._isConnected;
    },
    transact: function (asyncSqlStmntsArray, onTransactionErrorCallback, onTransactionSuccessCallback) {
        
        var _feH = onTransactionErrorCallback || this._dbq_onTransactionError;
        var _fsH = onTransactionSuccessCallback || this._dbq_onTransactionSuccess;
        
        var _sqls = asyncSqlStmntsArray.getArray();
        
        this._DB.transaction(function (transaction) {
            //"use strict";
            
            eval("Object.getPrototypeOf(transaction).objInstance = _sqls[0][0];");
            
            var _js = "";
            
            for (var i=0; i<_sqls.length; i++) {
                
                _js += "transaction.executeSql('"+_sqls[i][1]+"', "+(_sqls[i][2] === null ? null : "new Array('"+_sqls[i][2].join("','")+"')")+", "+_sqls[i][3]+', '+_sqls[i][4]+');';
            }
            
            eval(_js);
        }, _feH, _fsH);
    },
    _dbq_onTransactionError: function () {
        
        throw new StorageException("Transaction error.");
    },
    _dbq_onTransactionSuccess: function () {
        
        console.log("Transaction successful.");
    },
    getLastInsertRowId: function (columnAliasName, statementCallback, obj) {
        
        sqlArray = new AsyncSQLStatementsArray();
        
        sqlArray.push((obj===null?this:obj), "SELECT last_insert_rowid() AS "+columnAliasName+";", [], statementCallback, SFH_errorHandler);
        
        this.transact(sqlArray);
    }
});





/**
 *  StorageSync Class
 *
 *  Core Synchronous Database methods.
 */
var SyncStorage = Class.create({
    
    initialize: function (dbName, dbVersion, dbDisplayName, dbSize, dbCallback) {
        
        this._lastResultSet = null;
        this._isSuccess = false;
        
        this._DB = null;
        
        this._dbName = dbName;
        this._dbVersion = dbVersion;
        this._dbDisplayName = dbDisplayName;
        this._dbSize = dbSize;
        this._dbCallback = dbCallback || this._dbq_onConnect;
        
        this._isConnected = false;
    },
    connect: function () {
        
        try {
            
            if (!window.openDatabaseSync) {
                
                throw StorageException.NOT_SUPPORTED;
            } else {
                
                this._DB = window.openDatabaseSync(this._dbName, this._dbVersion, this._dbDisplayName, this._dbSize, this._dbCallback);
                
                this._isConnected = true;
            }
        } catch(e) {
            
            switch (e) {
                /*
                case UNKNOWN_ERR:
                    break;
                case DATABASE_ERR:
                    break;
                case VERSION_ERR:
                    break;
                case TOO_LARGE_ERR:
                    break;
                case QUOTA_ERR:
                    break;
                case SYNTAX_ERR:
                    break;
                case CONSTRAINT_ERR:
                    break;
                case TIMEOUT_ERR:
                    break;
                */
                case INVALID_STATE_ERR:
                    throw new StorageException('Invalid database version.');
                    break;
                default:
                    throw new StorageException('Unknown error '+e.message+'.');
            }
        }
        
        return this._isConnected;
    },
    _dbq_onConnect: function (database) {
        
        console.log("Database connected.");
    },
    getConn: function () {
        
        return this._DB;
    },
    isConnected: function () {
        
        return this._isConnected;
    },
    transact: function (syncSqlStmntsArray) {
        
        var _sqls = syncSqlStmntsArray.getArray();
        
        this._DB.transaction(function (transaction) {
            //"use strict";
            
            eval("Object.getPrototypeOf(transaction).objInstance = _sqls[0][0];");
            
            var _js = "";
            
            for (var i=0; i<_sqls.length; i++) {
                
                _js += "transaction.executeSql('"+_sqls[i][1]+"', "+(_sqls[i][2] === null ? null : "new Array('"+_sqls[i][2].join("','")+"')")+');';
            }
            
            eval(_js);
        });
    },
    getLastInsertRowId: function (collumnAliasName, obj) {
        
        sqlArray = new SyncSQLStatementsArray();
        
        sqlArray.push((obj===null?this:obj), "SELECT last_insert_rowid() AS "+columnAliasName+";", []);
        
        this.transact(sqlArray);
    }
});




/**
 *  =============================================
 *  SFH_* (Storage Function Handlers)
 *  =============================================
 */

function SFH_errorHandler(transaction, error) {
    
    var _this = transaction.objInstance;
    delete transaction.objInstance;
    
    throw new StorageException('Oops.  Error was '+error.message+' (Code '+error.code+')');
}

function SFH_killTransaction(transaction, error) {
    
    return true;
}

