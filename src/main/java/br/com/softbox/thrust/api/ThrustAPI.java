package br.com.softbox.thrust.api;

import java.io.File;
import java.io.IOException;
import java.net.URISyntaxException;
import java.nio.file.Files;
import java.nio.file.Paths;

import org.graalvm.polyglot.Context;
import org.graalvm.polyglot.Value;

import br.com.softbox.thrust.core.Thrust;

public class ThrustAPI {
	private Context context;
	
	private String rootPath;
	private Value requireFunction;
	
	public static String JAR_ROOTPATH = "JAR";
	
	public ThrustAPI(String rootPath) {
		this.rootPath = rootPath;
		this.context = Context.newBuilder("js").allowAllAccess(true).build();
	}
	
	/**
	 * 
	 * @param filePath
	 * @return org.graalvm.polyglot.Value (result of require execution)
	 * Obs: require function has public visibility because it could be called directly from bitcode's Java implementation, by importing ThrusAPI.jar.
	 * 		It is just a wrapper here.
	 * @throws IOException 
	 * @throws URISyntaxException 
	 */
	public Value require(String filePath) throws URISyntaxException, IOException {
		if(this.requireFunction == null) {
			String jarDir = new File(Thrust.class.getProtectionDomain().getCodeSource().getLocation().toURI()).getParent();
			
			String requireScriptContent = null;
			
			try {
				requireScriptContent = new String (Files.readAllBytes( Paths.get(jarDir + "/require.js")));
			} catch(IOException e) {
				requireScriptContent = new String (Files.readAllBytes( Paths.get("./require.js")));
			}
			
			
	    	this.requireFunction = this.context.eval("js", requireScriptContent);
		}
		
    	return requireFunction.invokeMember("require", this.rootPath, this.rootPath, filePath);
    }
		
}