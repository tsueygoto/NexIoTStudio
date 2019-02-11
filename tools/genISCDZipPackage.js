/**
 *
 */

var fs = require('fs');
var path = require('path');
var archiver = require('archiver');

/**
 *
 */
function zipFolder(srcFolder, zipFilePath, callback)
{
    // first to check target file exist then delete then create
    if (fs.existsSync(zipFilePath)) {
        fs.unlinkSync(zipFilePath);
    }
    
    var output = fs.createWriteStream(zipFilePath);
    var zipArchive = archiver('zip',{
        zlib: { level: 9 } // Sets the compression level.
    });

    output.on('close', function() {
        callback();
    });

    zipArchive.pipe(output);

    //zipArchive.bulk([
    //    { cwd: srcFolder, src: ['**/*'], dot: true, expand: true }
    //]);
    
    // append a file
    /**
     * The auto deploy needs
        file        : ocds-setup.bat
        file        : gw.conf
        file        : cloudDeploy.ps1
        directory   : azure-profile
     */
    zipArchive.file(path.join(srcFolder,'/OCD/One-ClickDeployerSetupPackage/ocds-setup.bat'),
        {name: 'ocds-setup.bat' });
    zipArchive.file(path.join(srcFolder,'/OCD/One-ClickDeployerSetupPackage/gw.conf'),
        {name: 'gw.conf' });
    zipArchive.file(path.join(srcFolder,'/OCD/One-ClickDeployerSetupPackage/cloudDeploy.ps1'),
        {name: 'cloudDeploy.ps1' });
    // append files from a sub-directory and naming it `new-subdir` within the archive
    zipArchive.directory(path.join(srcFolder,'/OCD/One-ClickDeployerSetupPackage/azure-profile/'), 'azure-profile');
    
    /**
     * The IoT Studio Cloud Dashboard Package
        DIRECTORY
            red
            public
            nodes
            .node-red
                .dash
                    .[GW folder]
                    settings_default.json
                    user_conf.json
                .flows
                    .[GW folder]
                    flows-ISCD.json                    
        FILE
            editor/templates/index.mst
            .gitignore
            .jshintrc
            .nodemonignore
            .travis.yml
            CHANGELOG.md
            CODE_OF_CONDUCT.md
            CONTRIBUTING.md
            README.md
            LICENSE
            IoT-Studio.js
            package.json
            red.js
            settings.js
     */
    
    zipArchive.directory(path.join(srcFolder,'/../red/'), 'IoT-Studio-Cloud-Dashboard/red');
    zipArchive.directory(path.join(srcFolder,'/../public/'), 'IoT-Studio-Cloud-Dashboard/public');
    zipArchive.directory(path.join(srcFolder,'/../nodes/'), 'IoT-Studio-Cloud-Dashboard/nodes');
    
    // create .node-red folder
    zipArchive.append(' ', {name: 'IoT-Studio-Cloud-Dashboard/editor/.placehold'});
    zipArchive.file(path.join(srcFolder,'/../editor/templates/index.mst'), { name: 'IoT-Studio-Cloud-Dashboard/editor/templates/index.mst' });    
    
    zipArchive.file(path.join(srcFolder,'/../.gitignore'), { name: 'IoT-Studio-Cloud-Dashboard/.gitignore' });    
    zipArchive.file(path.join(srcFolder,'/../.jshintrc'), { name: 'IoT-Studio-Cloud-Dashboard/.jshintrc'});
    zipArchive.file(path.join(srcFolder,'/../.nodemonignore'), { name: 'IoT-Studio-Cloud-Dashboard/.nodemonignore'});
    zipArchive.file(path.join(srcFolder,'/../.travis.yml'), { name: 'IoT-Studio-Cloud-Dashboard/.travis.yml'});
    zipArchive.file(path.join(srcFolder,'/../CHANGELOG.md'), { name: 'IoT-Studio-Cloud-Dashboard/CHANGELOG.md'});
    zipArchive.file(path.join(srcFolder,'/../CODE_OF_CONDUCT.md'), { name: 'IoT-Studio-Cloud-Dashboard/CODE_OF_CONDUCT.md'});
    zipArchive.file(path.join(srcFolder,'/../CONTRIBUTING.md'), { name: 'IoT-Studio-Cloud-Dashboard/CONTRIBUTING.md'});
    zipArchive.file(path.join(srcFolder,'/../IoT-Studio.js'), { name: 'IoT-Studio-Cloud-Dashboard/IoT-Studio.js'});
    zipArchive.file(path.join(srcFolder,'/../LICENSE'), { name: 'IoT-Studio-Cloud-Dashboard/LICENSE'});
    zipArchive.file(path.join(srcFolder,'/../README.md'), { name: 'IoT-Studio-Cloud-Dashboard/README.md'});
    zipArchive.file(path.join(srcFolder,'/../red.js'), { name: 'IoT-Studio-Cloud-Dashboard/red.js'});

    // ISCD package.json & settings.js
    zipArchive.file(path.join(srcFolder,'/OCD/One-ClickDeployerSetupPackage/IoT-Studio-Cloud-Dashboard/package.json'),
        {name: 'IoT-Studio-Cloud-Dashboard/package.json'});
    zipArchive.file(path.join(srcFolder,'/OCD/One-ClickDeployerSetupPackage/IoT-Studio-Cloud-Dashboard/settings.js'),
        {name: 'IoT-Studio-Cloud-Dashboard/settings.js'});
    
    // create .node-red folder
    zipArchive.append(' ', {name: 'IoT-Studio-Cloud-Dashboard/.node-red/.placehold'});
    
    // process .node-red/flows folder
    zipArchive.file(path.join(srcFolder,'/flows/flows-ISCD.json'),
        {name: 'IoT-Studio-Cloud-Dashboard/.node-red/flows/flows-ISCD.json'});

    // create GW folder
    //zipArchive.file(path.join(srcFolder, '/flows/', settings.ocdCurConf.deviceId, '.placehold'),
    //    {name: 'IoT-Studio-Cloud-Dashboard/.node-red/flows/'+settings.ocdCurConf.deviceId+'/.placehold'});

    // process .node-red/.dash folder
    zipArchive.file(path.join(srcFolder,'/.dash/settings_default.json'),
        {name: 'IoT-Studio-Cloud-Dashboard/.node-red/.dash/settings_default.json'});
    zipArchive.file(path.join(srcFolder,'/.dash/user_conf.json'),
        {name: 'IoT-Studio-Cloud-Dashboard/.node-red/.dash/user_conf.json'});
    //zipArchive.file(path.join(srcFolder, '/.dash/', settings.ocdCurConf.deviceId, '.placehold'),
    //    {name: 'IoT-Studio-Cloud-Dashboard/.node-red/.dash/'+settings.ocdCurConf.deviceId+'/.placehold'});

    zipArchive.finalize(function(err, bytes) {
        if(err) {
            callback(err);
        }
    });
}

// base on current tools folder to extract ISCD package 
zipFolder(path.join(__dirname, '../,node-red'), './ocdSetupPackage.zip', function(err) 
{
    if(err) {
        console.log('TBD', err);
    } else {
        console.log('DONE');
        //var responseContext = 
        //    'The GW is **NOT** One-Click Deployer Enabled.\n' +
        //    '\n\n' +
        //    'Please donwload [One-Click Deployer Setup Package](' + req.protocol + '://' + req.get('host') + '/ocd/ocdSetupPackage.zip) to enable One-Click Deploer.';
        //res.send(responseContext);
    }
});
                
                