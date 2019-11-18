package br.com.softbox.tpm.brief;

import java.nio.file.Path;

public class JarCache extends DependencyCache {

	public JarCache(Jar jar, Path path) {
		super(jar, path);
	}

}
