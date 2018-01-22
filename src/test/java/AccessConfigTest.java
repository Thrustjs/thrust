import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.TestInstance.Lifecycle;

import br.com.softbox.thrust.main.Main;

@TestInstance(Lifecycle.PER_CLASS)
public class AccessConfigTest extends BaseTest {
	@Test
	public void run() throws Exception {
		Main.main(new String[] {"src/test/resources/AccessConfig/index.js"});
		//TODO: isolar o config devolvendo uma cópia na função getConfig
		//assertEquals("{}\n{\"name\":\"index.js\"}\n{}\n{\"name\":\"bitcode.js\"}\n{\"name\":\"index.js\"}\n", outContent.toString());
	}
}
