var URL = Java.type("java.net.URL")
var FileUtils = Java.type("org.apache.commons.io.FileUtils")

function downloadZip(repo, version, zipFile) {
  var name = repo + (version ? '@' + version : '');

	var url = new URL(getUrl(normalize(name)))
  
  try {
    FileUtils.copyURLToFile(url, zipFile);
  } catch (e) {
    console.log('Failed to install bitcode, are the name and version corrects? ' + name);
    throw e;
  }
}

/**
 * Normalize a repo string.
 * 
 * @param {String}
 *            repo
 * @return {Object}
 */

function normalize (repo) {
  var regex = /^((github|gitlab|bitbucket):)?((.+):)?([^/]+)\/([^@]+)(@(.+))?$/
  var match = regex.exec(repo)
  var type = match[2] || 'github'
  var origin = match[4] || null
  var owner = match[5]
  var name = match[6]
  var checkout = match[8] || 'master'

  if (origin == null) {
    if (type === 'github')
      origin = 'github.com'
    else if (type === 'gitlab')
      origin = 'gitlab.com'
    else if (type === 'bitbucket')
      origin = 'bitbucket.org'
  }

  return {
    type: type,
    origin: origin,
    owner: owner,
    name: name,
    checkout: checkout
  }
}

/**
 * Adds protocol to url in none specified
 * 
 * @param {String}
 *            url
 * @return {String}
 */

function addProtocol (origin) {
  if (!/^(f|ht)tps?:\/\//i.test(origin)) {
      origin = 'https://' + origin
  }

  return origin
}

/**
 * Return a zip or git url for a given `repo`.
 * 
 * @param {Object}
 *            repo
 * @return {String}
 */

function getUrl (repo) {
	var url

  	var origin = addProtocol(repo.origin)
  
  	if (/^git\@/i.test(origin))
  		origin = origin + ':'
    else
    	origin = origin + '/'

	if (repo.type === 'github')
		url = origin + repo.owner + '/' + repo.name + '/archive/' + repo.checkout + '.zip'
	else if (repo.type === 'gitlab')
		url = origin + repo.owner + '/' + repo.name + '/repository/archive.zip?ref=' + repo.checkout
	else if (repo.type === 'bitbucket')
		url = origin + repo.owner + '/' + repo.name + '/get/' + repo.checkout + '.zip'
	else
		url = github(repo)

  return url
}


exports = {
	downloadZip: downloadZip
}