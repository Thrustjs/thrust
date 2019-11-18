package br.com.softbox.tpm.brief;

import java.nio.file.Path;
import java.util.List;

public abstract class DependencyCache {

	protected final Dependency dependency;
	protected final Path cachePath;

	protected DependencyCache(Dependency dependency, Path path) {
		this.dependency = dependency;
		this.cachePath = path;
	}

	public Path getCachePath() {
		return cachePath;
	}

	@SuppressWarnings("unchecked")
	public <T extends Dependency> T getDependencyAs() {
		return (T) dependency;
	}

	public boolean isSameVersion(Dependency dependency) {
		return this.dependency != null && this.dependency.isSameVersion(dependency);
	}

	public static boolean containsSameVersion(List<? extends DependencyCache> list, Dependency dependency) {
		return list != null && list.stream().anyMatch(dependencyCache -> dependencyCache.isSameVersion(dependency));
	}

}
