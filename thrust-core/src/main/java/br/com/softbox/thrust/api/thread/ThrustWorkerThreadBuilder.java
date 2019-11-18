package br.com.softbox.thrust.api.thread;

import java.io.IOException;
import java.net.URISyntaxException;

@FunctionalInterface
public interface ThrustWorkerThreadBuilder {

	ThrustWorkerThread build(LocalWorkerThreadPool pool) throws IOException, URISyntaxException;

}
