var File = Java.type("java.io.File")
var URL = Java.type("java.net.URL")
var Channels = Java.type("java.nio.channels.Channels")
var FileOutputStream = Java.type("java.io.FileOutputStream")
var Long = Java.type("java.lang.Long")
var FilenameFilter = Java.type("java.io.FilenameFilter")
var FileUtils = Java.type("org.apache.commons.io.FileUtils")

var HTTPClient = require("httpclient")

function GLClient () {
    var host = "https://gitlab.com/api/v4"

    return {
        get: function _get (url, params) {
            return HTTPClient.get([host, url].join(""), params)
        },
        post: function _post (url, params) {
            return HTTPClient.post([host, url].join(""), params)
        }
    }
}

var client = GLClient()

function get_project_id(prefix, repository) {
    var response = client.get(["/projects/", prefix, "%2F", repository].join(""))
    var contents = JSON.parse(response.fetch())
    return contents.id
}

function get_brief_of_module(projectId) {
    var response = client.get(["/projects/", projectId, "/repository/files/brief.json"].join(""),{ref:"master"})
    var contents = JSON.parse(response.fetch())

    var brief = JSON.parse(atob(contents.content))
    return brief
}

function get_file_content(projectId, bitcodePath, bitcodeName) {
    var response = client.get(["/projects/", projectId, "/repository/files/" + bitcodePath.replace("/", "%2F")].join(""),{ref:"master"})
    var contents = JSON.parse(response.fetch())
    var fileContent = atob(contents.content)
    return fileContent
}

function get_module(prefix, repository, destDir) {
    print("Buscando BitCode a partir de '" + prefix + "/" + repository + "'...")

    var projectId = undefined
    
    try {
        projectId = get_project_id(prefix, repository)
    } catch(error) {
        print("ERRO: Falha ao buscar BitCode. Por favor, verifique o repositório.\n")
        return
    }
    
    if(projectId === undefined) {
        print("ERRO INTERNO: Não foi possível obter o ID do projeto. Por favor, tente novamente mais tarde.\n")
        return
    }
    
    var brief = undefined
    
    try {
        brief = get_brief_of_module(projectId)
    } catch(e) {
        print("ERRO: Não foi possível encontrar o arquivo 'brief.json' na raiz do repositório informado.\n")
        return
    }

    var bitcodePath = brief.path
    var bitcodeName = brief.bit

    if(bitcodePath === undefined || bitcodeName === undefined) {
        print("ERRO: O arquivo 'brief.json' não está no formato esperado.\n")
        return
    }

    print("\nBitCode '" + bitcodeName + "' encontrado. Efetuando download dos arquivos...")

    var fileContent = get_file_content(projectId, bitcodePath, bitcodeName)

    var instalationDir = (destDir ? "/" + destDir : "") + "/thrust/lib/" + prefix + "/" + bitcodeName + "/"
    fs.saveToFile(new File("").getAbsolutePath() + instalationDir + bitcodeName + ".js", fileContent)

    print("\nO BitCode '" + bitcodeName + "' foi instalado com sucesso em '" + instalationDir + "'!\n")
}

function init_project(destDir, prefix, repository) {
    var projectId = get_project_id(prefix, repository)

    var website = new URL("https://gitlab.com/api/v4/projects/" + projectId + "/repository/archive.zip")
    var rbc = Channels.newChannel(website.openStream())

    if(destDir) {
        var directory = new File(destDir)
        if (!directory.exists()){
            directory.mkdir()
        }
    } else {
        destDir = new File(".").getAbsolutePath()
    }

    var zipFileName = "thrustinit.zip"
    var zipPath = destDir + File.separator + zipFileName
    var fos = new FileOutputStream(zipPath)
    fos.getChannel().transferFrom(rbc, 0, Long.MAX_VALUE)

    var Utils = require("utils/utils")
    Utils.unzip(zipPath, destDir)

    var file = new File(destDir)
    var directories = file.list(new FilenameFilter() {
        accept: function (current, name) {
            var file = new File(current, name)
            return file.isDirectory() && file.getAbsolutePath().indexOf(repository) > -1
        }
    })

    FileUtils.copyDirectory(new File(destDir + File.separator + directories[0]), new File(destDir))

    FileUtils.deleteDirectory(new File(destDir + File.separator + directories[0]))
    FileUtils.deleteDirectory(new File(destDir + File.separator + "git-hooks"))
    FileUtils.deleteQuietly(new File(destDir + File.separator + ".gitignore"))
    FileUtils.deleteQuietly(new File(destDir + File.separator + "README.md"))
    FileUtils.deleteQuietly(new File(zipPath))
}

exports = {
    get_module: get_module,
    init_project: init_project
}
