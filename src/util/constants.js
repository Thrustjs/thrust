var Paths = Java.type("java.nio.file.Paths");
var System = Java.type('java.lang.System')

var LIB_PATH = ".lib";
var LIB_PATH_BITCODE = Paths.get(LIB_PATH, "bitcodes").toString();
var LIB_PATH_JAR = Paths.get(LIB_PATH, "jars").toString();

var LOCAL_REPO = Paths.get(System.getProperty("user.home"), ".thrust-cache").toString()
var LOCAL_REPO_BITCODE = Paths.get(LOCAL_REPO, "bitcodes").toString()
var LOCAL_REPO_JAR = Paths.get(LOCAL_REPO, "jars").toString()

exports = {
    LIB_PATH: LIB_PATH,
    LIB_PATH_BITCODE: LIB_PATH_BITCODE,
    LIB_PATH_JAR: LIB_PATH_JAR,

    LOCAL_REPO: LOCAL_REPO,
    LOCAL_REPO_BITCODE: LOCAL_REPO_BITCODE,
    LOCAL_REPO_JAR: LOCAL_REPO_JAR,

    DEF_SEED_OWNER: "thrust-seeds",
    DEF_BITCODES_OWNER: "thrust-bitcodes",
    MAVEN_BASE_URL: "http://central.maven.org/maven2/{0}/{1}/{2}/{3}" //group/name/version/jarName
}