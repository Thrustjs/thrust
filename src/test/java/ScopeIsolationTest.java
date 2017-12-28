import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.TestInstance.Lifecycle;

import br.com.softbox.thrust.main.Main;

@TestInstance(Lifecycle.PER_CLASS)
/*
 * @Description("Tests index.js requiring bitcode.js and bitcode2.js, but bitcode.js overwrites require function")
 */
public class ScopeIsolationTest extends BaseTest {
	@Test
	public void run() throws Exception {
		Main.main(new String[] {"src/test/resources/ScopeIsolation/index.js"});
		assertEquals("index.js\nbitcode.js\nother empty require function!\nbitcode2.js\n", outContent.toString());
		;
	}
}

