package br.com.softbox.thrust.test;

import java.util.Arrays;
import java.util.List;

import org.junit.Assert;
import org.junit.Test;

import br.com.softbox.tpm.TpmUtil;
import br.com.softbox.tpm.brief.Bitcode;
import br.com.softbox.tpm.brief.DependencyHelper;
import br.com.softbox.tpm.brief.Jar;

public class BitcodeTest {

	@Test
	public void compareBitcodes() {

		Bitcode bc1 = (Bitcode) DependencyHelper.buildFromResource("database");
		Bitcode bc2 = (Bitcode) DependencyHelper.buildFromResource("softbox/database");
		Bitcode bc3 = (Bitcode) DependencyHelper.buildFromResource("dabase@1.2.3rc");
		Bitcode bc4 = (Bitcode) DependencyHelper.buildFromResource("database");
		Bitcode bc5 = (Bitcode) DependencyHelper.buildFromResource(Bitcode.DEFAULT_OWNER + "/database");
		Bitcode bc6 = (Bitcode) DependencyHelper.buildFromResource("github://database");
		Bitcode bc7 = (Bitcode) DependencyHelper.buildFromResource("github://thrust-bitcodes/database");
		Jar jar = new Jar("database:database:database");

		List<Bitcode> lst = Arrays.asList(bc1, bc2, bc3, bc4, bc5);
		for (Bitcode b1 : lst) {
			Assert.assertNotNull(b1.getVersionOrDefault());
			Assert.assertNotNull(b1.getName());
			Assert.assertNotNull(b1.getOwner());
			Assert.assertNotNull(b1.getRepository());
			Assert.assertNotNull(b1.getVersionOrDefault());
			Assert.assertNotNull(b1.getType());
			Assert.assertNotNull(b1.getRootPath());

			Assert.assertFalse(b1.isSame(null));
			Assert.assertFalse(b1.isSame(jar));

			Assert.assertFalse(b1.isNumberVersion());

			String owner = b1.getOwner();
			if (b1.isThrustBitcode()) {
				Assert.assertTrue(TpmUtil.isEmpty(owner) || Bitcode.DEFAULT_OWNER.equals(owner));
			}
			Assert.assertFalse(b1.isSameVersion(null));
			Assert.assertFalse(b1.isSameVersion(jar));
			for (Bitcode b2 : lst) {
				b1.isSame(b2);
				b1.isSameVersion(b2);
			}
		}
		Assert.assertNotNull(bc1);
		Assert.assertTrue(bc1.equals(bc1));
		Assert.assertTrue(bc1.equals(bc4));
		Assert.assertTrue(bc1.equals(bc5));
		Assert.assertTrue(bc1.equals(bc6));
		Assert.assertTrue(bc1.equals(bc7));
		Assert.assertFalse(bc1.equals(bc2));
		Assert.assertFalse(bc1.equals(bc3));

		Assert.assertTrue(bc1.isThrustBitcode());
		Assert.assertTrue(bc3.isThrustBitcode());
		Assert.assertTrue(bc4.isThrustBitcode());
		Assert.assertTrue(bc5.isThrustBitcode());
		Assert.assertFalse(bc2.isThrustBitcode());

		Assert.assertFalse(bc1.isSame(jar));
	}

	@Test(expected = RuntimeException.class)
	public void invalidType() throws Exception {
		String reference = "magalu://database/database";
		try {
			new Bitcode(reference);
			throw new Exception("Cannot run here");
		} catch (RuntimeException e) {
			Assert.assertTrue(e.getMessage().contains("Unknown origin"));
			Assert.assertTrue(e.getMessage().contains("for bitcode"));
			Assert.assertTrue(e.getMessage().contains(reference));
			throw e;
		}
	}

	@Test
	public void unknownOriginType() throws Exception {
		try {
			new Bitcode("space://database/databse");
			Assert.fail("Cannot continue");
		} catch (RuntimeException e) {
			Assert.assertTrue(e.getMessage().contains("Unknown origin "));
		}
	}

}
