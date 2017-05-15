/**
 * Created by hadoop on 17-5-13.
 */

var http = require('http');
var fs = require('fs');
var formidable = require("formidable");
var util = require('util');

var server = http.createServer(function (req, res) {
    if (req.method.toLowerCase() == 'get') {
        var reqPath = req.url;
        console.log(reqPath);
        if (reqPath == '/') {
            displayForm(res);
        } else {
            res.writeHead(200, {
                'content-type': 'text/plain'
            });
            res.write('Your Request URL don\'t exists!\n');
            res.end();
        }

    } else if (req.method.toLowerCase() == 'post') {
        processFormFieldsIndividual(req, res);
    }
});

function displayForm(res) {
    fs.readFile('index.html', function (err, data) {
        res.writeHead(200, {
            'Content-Type': 'text/html',
            'Content-Length': data.length
        });
        res.write(data);
        res.end();
    });
}

/*function processAllFieldsOfTheForm(req, res) {
    var form = new formidable.IncomingForm();

    form.parse(req, function (err, fields, files) {
        //Store the data from the fields in your data store.
        //The data store could be a file or database or any other store based
        //on your application.
        res.writeHead(200, {
            'content-type': 'text/plain'
        });
        res.write('received the data:\n\n');
        res.end(util.inspect({
            fields: fields,
            files: files
        }));
    });
}*/

function isDiskGt75pOrLt3G(line) {
    var splits = line.split(/[\s]+/);
    var available = parseInt(splits[3]);
    splits[4] = splits[4].replace('%', '');
    var used = parseInt(splits[4]);
    console.log("available: " + splits[3] + " used: " + splits[4]);
    if (available < 3145728 || used > 75) {
        return true;
    }
    return false;
}

function findDiskFromFile(filePath) {

   /* var lineReader = require('readline').createInterface({
        input: fs.createReadStream(filePath)
    });*/

    var result = [];
    var array = fs.readFileSync(filePath).toString().split(/[\r\n]/);
    console.log(array.length);
    console.log(array[array.length-2]);
    console.log(array[array.length-1]);
    for(i in array) {
        if (i == 0) {
            result.push(array[0]);
            continue;
        }

        if (array[i].length < 5) continue;

        if (isDiskGt75pOrLt3G(array[i].trim()) == true) {
            result.push(array[i]);
        }
    }

    /*   var lineNum = 0;
    lineReader.on('line', function (line) {
        lineNum++;
        if (lineNum == 1) {
            result.push(line);
            return;
        }

        if (isDiskGt75pOrLt3G(line)) {
            result.push(line);
            console.log('Ok Line: ', line);
        } else {
            console.log('Not Ok: ', line);
        }
    });
    lineReader.close();*/

    return result;
}

function findDiskGt75pOrLt3G(text) {
    var lines = text.split(/[\r\n]/);
    var result = [];
    for (x in lines) {

        if (x == 0) {
            result.push(lines[0]);
            continue;
        }

        if (lines[x].length < 5) continue;
        var splits = lines[x].split(/[\s]+/);
        console.log("available: " + splits[3] + " used: " + splits[4]);

        var available = parseInt(splits[3]);
        splits[4] = splits[4].replace('%', '');
        var used = parseInt(splits[4]);

        if (available < 3145728 || used > 75) {
            result.push(lines[x]);
        }
    }
    return result;
}



function processFormFieldsIndividual(req, res) {

    var result = [];
    var form = new formidable.IncomingForm();
    form.uploadDir = "./upload"

    //Call back when each field in the form is parsed.
    form.on('field', function (field, value) {
        console.log("server got a content: ", value);

        if (field != 'dfText' || value == null
            || value.length <= 10) return;

        result = findDiskGt75pOrLt3G(value);
    });

    //Call back when each file in the form is parsed.
    form.on("file", function (name, file) {
        console.log("received a file: ", file.name, "\n\r    file size : ", file.size);
        // console.log(file);

        if (file == null || file.isUndefined) return;

        var lineSet = findDiskFromFile(file.path);

        lineSet.forEach(function (line) {
            result.push(line);
        });

        // result = result.concat(lineSet);
    });

/*    //Call back for file upload progress.
    form.on('progress', function (bytesReceived, bytesExpected) {

    });*/

    //Call back at the end of the form.
    form.on('end', function () {
        res.writeHead(200, {
            'content-type': 'text/plain'
        });

        result.forEach(function (line) {
            res.write(line + '\n');
        });

        res.end();
    });

    form.parse(req);

}

var port = 8080;
server.listen(port);

console.log("server listening on: " + port);