package br.com.softbox.thrust.api.thread;

import java.io.IOException;
import java.net.URISyntaxException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

import org.graalvm.polyglot.Value;

import br.com.softbox.thrust.api.ThrustContextAPI;

public abstract class ThrustWorkerThread extends Thread {

	protected final LocalWorkerThreadPool pool;
	protected final AtomicBoolean active;
	protected final List<Value> listJS;
	protected LocalDateTime lastTimeUsed;
	protected ThrustContextAPI thrustContextAPI;
	protected final String bitcodePath;

	public ThrustWorkerThread(LocalWorkerThreadPool pool, String bitcodePkg, List<String> js)
			throws IOException, URISyntaxException {

		this.pool = pool;
		this.active = new AtomicBoolean(true);
		this.bitcodePath = mountBitcodePath(pool.getRootPath(), bitcodePkg);
		this.listJS = new ArrayList<>();

		updateLastTimeUsed();
		loadThrustContextAPI(js);
	}

	protected synchronized void loadThrustContextAPI(List<String> srcJsArray) throws IOException, URISyntaxException {
		this.thrustContextAPI = new ThrustContextAPI(pool.getRootPath());
		this.listJS.clear();
		for (String js : srcJsArray) {
			listJS.add(thrustRequire(js, true));
		}
	}

	protected Value thrustRequire(String jsFile, boolean isBitcode) throws IOException, URISyntaxException {
		Path jsPath = isBitcode ? Paths.get(this.bitcodePath, jsFile)
				: Paths.get(thrustContextAPI.getRootPath(), jsFile);
		if (!Files.exists(jsPath)) {
			throw new RuntimeException("Path not found: " + jsPath);
		}
		return thrustContextAPI.require(jsPath.toString());
	}

	private static String mountBitcodePath(String rootPath, String bitcodePkg) {
		if (bitcodePkg != null) {
			List<String> buildPathList = new ArrayList<String>();
			buildPathList.add(".lib");
			buildPathList.add("bitcodes");
			if (bitcodePkg.indexOf("/") == -1) {
				buildPathList.add("thrust-bitcodes");
			}
			buildPathList.add(bitcodePkg);
			Path path = buildPathList.stream().map(Paths::get).reduce(Paths.get(rootPath), (bp, p) -> bp.resolve(p));
			return path.toString();
		}
		return null;
	}

	public LocalDateTime getLastTimeUsed() {
		return lastTimeUsed;
	}

	public void updateLastTimeUsed() {
		lastTimeUsed = LocalDateTime.now();
	}

	public void inactivate() {
		synchronized (this) {
			active.set(false);
			this.notify();
		}
	}

	protected void startCurrentThread() {
		synchronized (this) {
			if (!isAlive()) {
				this.start();
			} else {
				this.notify();
			}
		}
	}
}
