package br.com.softbox.tpm.brief;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.net.URL;
import java.nio.file.Path;
import java.util.logging.Level;
import java.util.logging.Logger;

import br.com.softbox.tpm.TpmUtil;

public final class Downloader {
	private static final String ORIGIN_GITHUB = "github";
	private static final String MAVEN_BASE_URL = "http://central.maven.org/maven2/%s/%s/%s/%s";
	private static final Logger logger = Logger.getLogger(Downloader.class.getName());

	private Downloader() {
		super();
	}

	public static void downloadBitcode(Bitcode bitcode, File dnlZipFile) throws IOException {
		try {
			URL url = mountBitcodeURL(bitcode);
			TpmUtil.downloadURL(url, dnlZipFile.toPath());
		} catch (IOException e) {
			logger.log(Level.SEVERE,
					"Failed to install bitcode, are the name and version corrects? " + bitcode.getName(), e);
			throw e;
		}
	}

	public static URL mountBitcodeURL(Bitcode bitcode) throws MalformedURLException {
		String urlStr = getUrl(normalize(bitcode));
		return new URL(urlStr);
	}

	private static Repo normalize(Bitcode bitcode) {
		Repo repo = new Repo();
		repo.setTypeAndOrigin(bitcode.getType());
		repo.owner = bitcode.getOwner();
		repo.name = bitcode.getRepository();
		repo.checkout = bitcode.getVersionOrDefault();
		return repo;
	}

	private static String addProtocol(String origin) {
		if (!origin.matches("^(f|ht)tps?:\\/\\/")) {
			origin = "https://" + origin;
		}
		return origin;
	}

	private static String getUrl(Repo repo) {
		String sufixOrigin = addProtocol(repo.origin);
		String origin = sufixOrigin + (sufixOrigin.matches("(?i:^git\\@)") ? ":" : "/");
		logger.log(Level.FINE, () -> "Origin: " + origin);
		String prefixOrigin = origin + repo.owner + "/" + repo.name;
		if (repo.type.equals(ORIGIN_GITHUB)) {
			return prefixOrigin + "/archive/" + repo.checkout + ".zip";
		}
		if (repo.type.equals("gitlab")) {
			return prefixOrigin + "/repository/archive.zip?ref=" + repo.checkout;
		}
		if (repo.type.equals("bitbucket")) {
			return prefixOrigin + "/get/" + repo.checkout + ".zip";
		}
		return prefixOrigin + "/archive/" + repo.checkout + ".zip";
	}

	public static void downloadJar(Jar jar, Path jarCachePath) throws IOException {
		downloadFromMaven(jar, true, jarCachePath);
	}

	public static void downloadJarPOM(Jar jar, Path pomCachePath) throws IOException {
		downloadFromMaven(jar, false, pomCachePath);
	}

	private static URL mountMavenURL(Jar jar, boolean isJar) throws MalformedURLException {
		String name = isJar ? jar.getName() : jar.getPomName();
		return new URL(String.format(MAVEN_BASE_URL, jar.getGroup().replaceAll("\\.", "/"), jar.getArtifact(),
				jar.getVersion(), name));
	}

	private static void downloadFromMaven(Jar jar, boolean isJar, Path path) throws IOException {
		URL url = mountMavenURL(jar, isJar);
		TpmUtil.downloadURL(url, path);
	}

	public static void checkForDownload(Dependency dependency) {
		URL url;
		try {
			if (dependency instanceof Bitcode) {
				url = mountBitcodeURL((Bitcode) dependency);
			} else {
				url = mountMavenURL((Jar) dependency, true);
			}
		} catch (MalformedURLException e) {
			throw new RuntimeException("Invalid dependency name: " + dependency.getReference(), e);
		}
		try {
			try (InputStream in = url.openStream()) {
				System.out.printf(" %s: Is a valid resource.%n", dependency.getReference());
			}
		} catch (IOException e) {
			throw new RuntimeException("Failed to access reference " + dependency.getReference(), e);
		}
	}

}