package br.com.softbox.thrust.core;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.net.MalformedURLException;
import java.net.URISyntaxException;
import java.net.URL;
import java.net.URLClassLoader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import br.com.softbox.thrust.api.ThrustContextAPI;

public final class Thrust {

	public static final String VERSION = "0.0.8-rc1";

	private static final String BRIEF_FILENAME = "brief.json";
	private static final String MAIN_JS = "index.js";

	private static String appDirectory;
	private static String thrustJarsDir;
	private static List<String> thrustArgs = Arrays.asList();

	public Thrust() {
		super();
	}

	private void run(String[] args) throws URISyntaxException, IOException {
		String mainJs = getMainJs(args);
		setAppDirectory(getAppDirectory(mainJs));
		setThrustJarsDirFromAppDirectory();
		loadRuntimeJars();
		ThrustContextAPI.requireFromThrust(Thrust.appDirectory, mainJs);
	}

	private static String getMainJs(String[] args) {
		if (args.length == 0) {
			throw new RuntimeException("Inform a thrust file or directory");
		}

		Optional<String> notArgs = Arrays.stream(args).filter(arg -> !arg.startsWith("-")).findFirst();

		if (!notArgs.isPresent()) {
			throw new RuntimeException("No thrust file or directory was informed");
		}

		String thrustFileOrDirectory = notArgs.get();

		File baseFile = new File(thrustFileOrDirectory);

		if (!baseFile.exists()) {
			throw new RuntimeException("Invalid thrust file/directory: " + thrustFileOrDirectory);
		}
		if (baseFile.isDirectory()) {
			baseFile = new File(baseFile, MAIN_JS);
			if (!baseFile.exists()) {
				throw new RuntimeException("Not found 'index.js' on " + thrustFileOrDirectory);
			}
		}
		return baseFile.getAbsolutePath();
	}

	public static Optional<String> findArg(String arg) {
		if (arg != null) {
			return thrustArgs.stream().filter(tArg -> tArg.startsWith(arg)).findFirst();
		}
		return Optional.empty();
	}

	private static String getAppDirectory(String startupFilePath) throws IOException {

		// O diretório da aplicação é o que contém 'brief.json'. Se não encontrar,
		// considerar o que contém o script

		Path appPath = getSafeParent(startupFilePath, true);
		Path appDirectoryPath = null;
		boolean searching = true;
		do {
			Path briefPath = Paths.get(appPath.toAbsolutePath().toString(), BRIEF_FILENAME);
			if (Files.exists(briefPath)) {
				appDirectoryPath = appPath;
				searching = false;
			} else {
				appPath = appPath.getParent();
				searching = appPath != null;
			}
		} while (searching);

		if (appDirectoryPath != null) {
			return appDirectoryPath.toString();
		}

		// Versão antiga
		if (startupFilePath.startsWith("/")) {
			appPath = Paths.get(startupFilePath);
		} else {
			appPath = Paths.get(".", MAIN_JS);
		}
		return getSafeParent(appPath.toAbsolutePath(), false).toString();
	}

	private void loadRuntimeJars() {
		File jarsDir = new File(thrustJarsDir);
		if (jarsDir.exists()) {
			if (!jarsDir.isDirectory()) {
				throw new RuntimeException("Expected to be a JAR directory: " + jarsDir.getAbsolutePath());
			}
			List<File> jarsDirectoyFiles = safeListFiles(thrustJarsDir);
			jarsDirectoyFiles.forEach(Thrust::loadJarForFile);
		}
	}

	private static void loadJarForFile(File file) {
		if (file.isFile()) {
			try {
				loadJarClassLoader(file);
			} catch (Exception e) {
				throw new RuntimeException("Failed to load jar " + file.getAbsolutePath(), e);
			}
		}
	}

	private static void loadJarClassLoader(File jarFile)
			throws FileNotFoundException, NoSuchMethodException, SecurityException, IllegalAccessException,
			IllegalArgumentException, InvocationTargetException, MalformedURLException {
		Method method = URLClassLoader.class.getDeclaredMethod("addURL", new Class[] { URL.class });
		method.setAccessible(true);

		method.invoke(ClassLoader.getSystemClassLoader(), jarFile.toURI().toURL());
	}

	public static String getAppDirectory() {
		return appDirectory;
	}

	public static List<String> getThrustArgs() {
		return thrustArgs;
	}

	public static Path getSafeParent(Path path, boolean isAbsolutePath) {
		Path parent = path != null ? path.getParent() : null;
		if (parent == null) {
			throw new RuntimeException("Parent path not found for " + path);
		}
		return isAbsolutePath ? parent.toAbsolutePath() : parent;
	}

	private static Path getSafeParent(String path, boolean isAbsolutePath) {
		return getSafeParent(Paths.get(path), isAbsolutePath);
	}

	static List<File> safeListFiles(String directory) {
		return safeListFiles(new File(directory));
	}

	private static List<File> safeListFiles(File directory) {
		File[] files = directory.listFiles();
		return files != null ? Arrays.asList(files) : Collections.emptyList();
	}

	private static void setAppDirectory(String appDirectory) {
		Thrust.appDirectory = appDirectory;
	}

	private static void setThrustJarsDirFromAppDirectory() {
		thrustJarsDir = Paths.get(appDirectory, ".lib", "jars").toAbsolutePath().toString();
	}

	private static void setThrustArgs(String... args) {
		thrustArgs = Arrays.stream(args).filter(arg -> arg.startsWith("-")).collect(Collectors.toList());
	}
	
	private static boolean isShowVersion() {
		return thrustArgs.stream().anyMatch(arg -> "-v".equals(arg) || "--version".equals(arg));
	}

	public static void main(String[] args) throws URISyntaxException, IOException {
		setThrustArgs(args);
		if (isShowVersion()) {
			System.out.println("thrust " + Thrust.VERSION);
		} else {
			new Thrust().run(args);
		}
	}
}
