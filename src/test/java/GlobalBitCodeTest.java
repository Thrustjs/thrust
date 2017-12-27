import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.TestInstance.Lifecycle;

import br.com.softbox.thrust.main.Main;

@TestInstance(Lifecycle.PER_CLASS)
/*
 * @Description("")
 */
public class GlobalBitCodeTest extends BaseTest {
	@Test
	public void run() throws Exception {
		Main.main(new String[] {"src/test/resources/GlobalBitCode/index.js"});
		assertEquals("I'm inside globalBitCode1.prints!\nI'm inside globalBitCode2.prints!\n", outContent.toString());
	}
}
