package br.com.softbox.tpm.brief;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.json.JSONArray;

public final class DependencyHelper {

	private DependencyHelper() {
	}

	public static List<Dependency> buildList(JSONArray dependenciesArray) {
		return buildListByClass(dependenciesArray, Dependency.class);
	}

	public static List<Jar> buildJarList(JSONArray dependenciesArray) {
		return buildListByClass(dependenciesArray, Jar.class);
	}

	public static List<Bitcode> buildBitcodeList(JSONArray dependenciesArray) {
		return buildListByClass(dependenciesArray, Bitcode.class);
	}

	private static <T extends Dependency> List<T> buildListByClass(JSONArray array, Class<T> clazz) {
		List<T> list = new ArrayList<>(array.length());
		array.forEach(dep -> addDependency(list, dep, clazz));
		return list;
	}

	@SuppressWarnings("unchecked")
	private static <T extends Dependency> void addDependency(List<T> dependencies, Object dependency, Class<T> clazz) {
		if (!(dependency instanceof String)) {
			throw new RuntimeException("Dependencies must be a string");
		}
		String dependencyStr = (String) dependency;
		boolean isJar = Jar.isJar(dependencyStr);

		boolean canInstantiate = clazz == Dependency.class || (isJar && clazz == Jar.class)
				|| (!isJar && clazz == Bitcode.class);

		if (canInstantiate) {
			Dependency dependencyObj;
			if (isJar) {
				dependencyObj = new Jar(dependencyStr);
			} else {
				dependencyObj = new Bitcode(dependencyStr);
			}
			dependencies.add((T) dependencyObj);
		}
	}

	public static boolean addDependency(BriefFile briefFile, Dependency dependency) {

		if (dependency == null) {
			return false;
		}
		validateNotNullBriefFile(briefFile);

		boolean isJar = dependency instanceof Jar;

		List<? extends Dependency> currentDependencies = isJar ? briefFile.getJars() : briefFile.getBitcodes();
		List<? extends Dependency> sameDependencies = currentDependencies.stream().filter(d -> d.isSame(dependency))
				.collect(Collectors.toList());
		List<? extends Dependency> trashDependencies = sameDependencies.stream()
				.filter(d -> !d.isSameVersion(dependency)).collect(Collectors.toList());

		return addNewDependencyValidating(briefFile, dependency, sameDependencies, trashDependencies);
	}

	private static boolean addNewDependencyValidating(BriefFile briefFile, Dependency dependency,
			List<? extends Dependency> sameDependencies, List<? extends Dependency> trashDependencies) {
		if (!sameDependencies.isEmpty()) {
			if (trashDependencies.isEmpty()) {
				return false;
			}
			removeOldDependencies(briefFile, trashDependencies);
		}
		briefFile.addDependency(dependency);

		return true;
	}

	private static void removeOldDependencies(BriefFile briefFile, List<? extends Dependency> trashDependencies) {
		List<Dependency> dependencies = briefFile.getDependencies().stream()
				.filter(d -> maintainNotTrash(d, trashDependencies)).collect(Collectors.toList());
		briefFile.setDependencies(dependencies);
	}

	private static boolean maintainNotTrash(Dependency currentDependency,
			List<? extends Dependency> trashDependencies) {
		return trashDependencies.stream().noneMatch(d -> d.getReference().equals(currentDependency.getReference()));
	}

	private static void validateNotNullBriefFile(BriefFile briefFile) {
		if (briefFile == null) {
			throw new NullPointerException("No briefFile");
		}
	}

	@SuppressWarnings("unchecked")
	public static <T extends Dependency> List<T> filter(List<Dependency> dependencies, Class<T> type) {
		return dependencies.stream().filter(d -> type.isAssignableFrom(d.getClass()))
				.map(obj -> (T) obj).collect(Collectors.toList());
	}
	
	public static Dependency buildFromResource(String resource) {
		return resource.matches("^.*:[^/]*$") ? new Jar(resource) : new Bitcode(resource);
	}

	public static Path getLocalJarPath(Jar jar, String baseDir) {
		String local = jar.getArtifact();
		if (!local.startsWith("/")) {
			return Paths.get(baseDir, local);
		}
		return Paths.get(local);
	}

}
