const URL = Java.type('java.net.URL')
const FileUtils = Java.type('org.apache.commons.io.FileUtils')

function downloadZip(repo, version, zipFile) {
    const name = repo + (version ? '@' + version : '')

    const url = new URL(getUrl(normalize(name)))

    try {
        FileUtils.copyURLToFile(url, zipFile)
    } catch (e) {
        console.log('Failed to install bitcode, are the name and version corrects? ' + name)
        throw e
    }
}

/**
 * Normalize a repo string.
 *
 * @param {String}
 *            repo
 * @return {Object}
 */

function normalize(repo) {
    const regex = /^((github|gitlab|bitbucket):)?((.+):)?([^/]+)\/([^@]+)(@(.+))?$/
    const match = regex.exec(repo)
    const type = match[2] || 'github'
    let origin = match[4] || null
    const owner = match[5]
    const name = match[6]
    const checkout = match[8] || 'master'

    if (origin == null) {
        if (type === 'github') {
            origin = 'github.com'
        } else if (type === 'gitlab') {
            origin = 'gitlab.com'
        } else if (type === 'bitbucket') {
            origin = 'bitbucket.org'
        }
    }

    return {
        type,
        origin,
        owner,
        name,
        checkout
    }
}

/**
 * Adds protocol to url in none specified
 *
 * @param {String}
 *            url
 * @return {String}
 */
const addProtocol = (origin) => !/^(f|ht)tps?:\/\//i.test(origin)
    ? 'https://' + origin
    : origin

/**
 * Return a zip or git url for a given `repo`.
 *
 * @param {Object}
 *            repo
 * @return {String}
 */

function getUrl(repo) {
    let url

    let origin = addProtocol(repo.origin)

    if (/^git@/i.test(origin)) {
        origin = origin + ':'
    } else {
        origin = origin + '/'
    }

    if (repo.type === 'github') {
        url = origin + repo.owner + '/' + repo.name + '/archive/' + repo.checkout + '.zip'
    } else if (repo.type === 'gitlab') {
        url = origin + repo.owner + '/' + repo.name + '/repository/archive.zip?ref=' + repo.checkout
    } else if (repo.type === 'bitbucket') {
        url = origin + repo.owner + '/' + repo.name + '/get/' + repo.checkout + '.zip'
    } else {
        url = github(repo)
    }
    return url
}

exports = {
    downloadZip: downloadZip
}
