package br.com.softbox.tpm.brief;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Optional;
import java.util.function.Consumer;
import java.util.stream.Collectors;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public class BriefFile {

	public static final String PARAM_DEPENDENCIES = "dependencies";
	private static final String PARAM_MAIN = "main";
	private static final String PARAM_NAME = "name";
	private static final String PARAM_VERSION = "version";

	public static final String FILE_NAME = "brief.json";

	private File file;
	private JSONObject brief;

	private BriefFile(JSONObject json) {
		brief = json;
	}

	public String toJSON() {
		return brief.toString(2);
	}

	public String toString() {
		return brief.toString();
	}

	public File getFile() {
		return file;
	}

	public File getRootDirectory() {
		return file != null ? file.getParentFile() : null;
	}

	public Optional<String> getPath() {
		if (brief.has("path")) {
			return Optional.ofNullable(brief.getString("path"));
		}
		return Optional.empty();
	}

	private String getString(String attr) {
		return brief.has(attr) ? brief.getString(attr) : null;
	}

	public String getVersion() {
		return getString(PARAM_VERSION);
	}

	public String getName() {
		return getString(PARAM_NAME);
	}
	
	public String getMain() {
		return getString(PARAM_MAIN);
	}
	
	public void setMain(String main) {
		this.brief.put(PARAM_MAIN, main);
	}

	public void setName(String name) {
		this.brief.put(PARAM_NAME, name);
	}

	public boolean hasDependencies() {
		return brief.has(PARAM_DEPENDENCIES);
	}

	private JSONArray getDependenciesArray() {
		return brief.getJSONArray(PARAM_DEPENDENCIES);
	}

	public List<Dependency> getDependencies() {
		return DependencyHelper.buildList(getDependenciesArray());
	}

	public List<Jar> getJars() {
		return DependencyHelper.buildJarList(getDependenciesArray());
	}
	
	public List<Jar> getLocalJars() {
		return getJars().stream().filter(Jar::isLocal).collect(Collectors.toList());
	}
	
	public List<Bitcode> getBitcodes() {
		return DependencyHelper.buildBitcodeList(getDependenciesArray());
	}

	public void setDependencies(List<Dependency> dependencies) {
		JSONArray array = new JSONArray();
		Consumer<Dependency> add = d -> array.put(d.reference);
		dependencies.forEach(add);
		setDependenciesArray(array);
	}

	private void setDependenciesArray(JSONArray array) {
		this.brief.put(PARAM_DEPENDENCIES, array);
	}

	public void addDependency(Dependency dependency) {
		List<Dependency> dependencies = getDependencies();
		if (!dependencies.contains(dependency)) {
			dependencies.add(dependency);
			setDependencies(dependencies);
		}
	}

	public void serialize() throws IOException {
		if (this.file == null) {
			throw new RuntimeException("Missing file path from brief data");
		}
		serialize(this.file.toPath());
	}

	public void serialize(Path briefPath) throws IOException {
		Files.write(briefPath, this.toJSON().getBytes("utf-8"));
	}

	public static BriefFile buildSample() {
		BriefFile briefFile = new BriefFile(new JSONObject());
		briefFile.brief.put(PARAM_NAME, "");
		briefFile.brief.put("description", "Thrust project");
		briefFile.brief.put(PARAM_VERSION, "0.0.1");
		briefFile.brief.put("path", "src");
		briefFile.brief.put(PARAM_MAIN, "src/index.js");
		briefFile.brief.put("dependencies", new JSONArray());

		return briefFile;
	}

	private void validateParameters() {
		if (!hasDependencies()) {
			brief.put(PARAM_DEPENDENCIES, new JSONArray());
		} else {
			Object dependenciesObj = brief.get(PARAM_DEPENDENCIES);
			if (!(dependenciesObj instanceof JSONArray)) {
				if (dependenciesObj instanceof JSONObject) {
					setDependenciesAsArray((JSONObject) dependenciesObj);
				} else {
					throw new RuntimeException("Invalid 'dependencies' type: " + dependenciesObj.getClass().getName());
				}
			}
		}
		getDependencies();
	}

	private void setDependenciesAsArray(JSONObject objDependencies) {
		JSONArray array = new JSONArray();
		copyArray(objDependencies, "jars", array);
		copyArray(objDependencies, "bitcodes", array);
		brief.put(PARAM_DEPENDENCIES, array);
	}

	private static void copyArray(JSONObject obj, String key, JSONArray dst) {
		if (obj.has(key)) {
			JSONArray src = obj.getJSONArray(key);
			src.forEach(dst::put);
		}
	}

	public static BriefFile loadFromFile(File fileBrief) throws IOException {

		if (fileBrief == null) {
			throw new NullPointerException("No brief file");
		}

		if (!fileBrief.exists()) {
			throw new FileNotFoundException(FILE_NAME);
		}

		Path pathBriefFile;
		if (fileBrief.isDirectory()) {
			pathBriefFile = fileBrief.toPath().resolve(FILE_NAME); 
			if (!Files.exists(pathBriefFile)) {
				throw new IllegalArgumentException(
						"File brief.json not found at directory " + fileBrief.getAbsolutePath());
			}
		} else {
			pathBriefFile = fileBrief.toPath();
		}
		BriefFile ret = new BriefFile(readFile(pathBriefFile));
		ret.file = pathBriefFile.toFile();
		ret.validateParameters();

		return ret;
	}

	private static JSONObject readFile(Path pathBriefFile) throws IOException {
		try {
			return new JSONObject(new String(Files.readAllBytes(pathBriefFile), "utf8"));
		} catch (JSONException e) {
			throw new RuntimeException("Failed to read JSON file " + pathBriefFile, e);
		}
	}

}