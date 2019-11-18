package br.com.softbox.thrust.api;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.URISyntaxException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Optional;
import java.util.stream.Collectors;

import org.graalvm.polyglot.Context;
import org.graalvm.polyglot.Context.Builder;
import org.graalvm.polyglot.Value;

import br.com.softbox.thrust.core.Thrust;

/**
 * API de contexto do Thrust.
 * 
 * @author softbox
 *
 */
public final class ThrustContextAPI {
	private static final int DEFAULT_DEBUG_PORT = 10000;
	private static final String ARG_DEBUG_PORT = "--debug-port=";
	private static int DEBUG_PORT = -1;
	private static final HashMap<String, Object> multiThreadContext = new HashMap<>();

	private final Context context;
	private final String rootPath;

	public ThrustContextAPI(String rootPath) {
		this.rootPath = rootPath;
		this.context = createContext();
		try {
			loadRequireFunction();
		} catch (URISyntaxException | IOException e) {
			throw new RuntimeException("Fail to load file for require function.", e);
		}
	}

	private Context createContext() {
		Builder builder = Context.newBuilder().allowAllAccess(true);
		configureDebug(builder);
		return builder.build();
	}

	/**
	 * Configuração do <i>debug</i>.
	 * 
	 * @param builder Construtor do contexto.
	 */
	private static void configureDebug(Builder builder) {
		Optional<String> debugEnabled = Thrust.findArg("-debug");
		if (debugEnabled.isPresent()) {
			int debugPort = DEBUG_PORT;
			if (debugPort == -1) {
				Optional<String> optDebugPort = Thrust.findArg(ARG_DEBUG_PORT);
				if (optDebugPort.isPresent()) {
					debugPort = Integer.parseInt(optDebugPort.get().substring(ARG_DEBUG_PORT.length()));
				} else {
					debugPort = DEFAULT_DEBUG_PORT;
				}
				DEBUG_PORT = debugPort + 1;
			}
			builder.option("inspect", String.valueOf(debugPort)).option("inspect.Suspend", "false")
					.option("inspect.Path", "thrust");
		}
	}

	private static String readJsFile(String filename) throws IOException {
		InputStream in = getResourceStream(filename, false);
		try (BufferedReader reader = new BufferedReader(new InputStreamReader(in, StandardCharsets.UTF_8))) {
			return reader.lines().collect(Collectors.joining("\n"));
		}
	}

	public Value loadRequireFunction() throws URISyntaxException, IOException {
		String requireScriptContent = readJsFile("require.js");
		return this.context.eval("js", requireScriptContent.replaceAll("<rootPath>", this.rootPath));
	}

	/**
	 * 
	 * @param filePath
	 * @return org.graalvm.polyglot.Value (result of require execution) Obs: require
	 *         function has public visibility because it could be called directly
	 *         from bitcode's Java implementation, by importing ThrusAPI.jar. It is
	 *         just a wrapper here.
	 * @throws IOException
	 * @throws URISyntaxException
	 */
	public Value require(String filePath) throws URISyntaxException, IOException {
		Path path = Paths.get(filePath).toAbsolutePath();
		return this.context.eval("js", "require('" + path.toString() + "')");
	}

	public static Object setValue(String name, Object obj) {
		return multiThreadContext.put(name, obj);
	}

	@SuppressWarnings("unchecked")
	public static <T> T getValue(String name) {
		return (T) multiThreadContext.get(name);
	}

	public static InputStream getResourceStream(String resource, boolean canNull) {
		InputStream in = ClassLoader.getSystemClassLoader().getResourceAsStream(resource);
		if (!canNull && in == null) {
			throw new RuntimeException("Resource not found: " + resource);
		}
		return in;
	}

	/**
	 * @return the rootPath
	 */
	public String getRootPath() {
		return rootPath;
	}

	/**
	 * Require que deveria ser chamado apenas pelo <code>Thrust.main</code>.
	 * 
	 * @param appDirectory   Diretório raiz da aplicação.
	 * @param fileStringPath Caminho string path.
	 * @throws IOException        Falha carregar arquivo.
	 * @throws URISyntaxException Falha URI.
	 */
	public static void requireFromThrust(String appDirectory, String fileStringPath)
			throws URISyntaxException, IOException {
		ThrustContextAPI thrustContextAPI = new ThrustContextAPI(appDirectory);
		thrustContextAPI.require(fileStringPath);
	}
}
