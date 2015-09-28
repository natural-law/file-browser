module.exports = {
    load: function () {
    },

    unload: function () {
    },

    'file-browser:open': function () {
        Editor.Panel.open('file-browser.panel');
    },

    'file-browser:delete': function ( thePath ) {
        Editor.log('Deleting %s', thePath);
        var fs = require('fs');
        var path = require('path');

        var deleteFolderRecursive = function(_path) {
            var files = [];
            if( fs.existsSync(_path) ) {
                files = fs.readdirSync(_path);
                files.forEach(function(file,index){
                    var curPath = path.join(_path, file);
                    if(fs.lstatSync(curPath).isDirectory()) {
                        // recurse
                        deleteFolderRecursive(curPath);
                    } else {
                        // delete file
                        fs.unlinkSync(curPath);
                    }
                });
            }

            fs.rmdirSync(_path);
        };

        try {
            var stats = fs.lstatSync(thePath);
            if (stats.isDirectory()) {
                deleteFolderRecursive(thePath);
            } else {
                fs.unlinkSync(thePath);
            }
            Editor.log('Delete %s succeed!', thePath);
        } catch (err) {
            Editor.log('Delete %s failed!', thePath);
        }
    }
};
