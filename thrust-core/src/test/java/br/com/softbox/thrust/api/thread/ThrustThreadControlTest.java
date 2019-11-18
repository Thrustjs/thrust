package br.com.softbox.thrust.api.thread;

import java.lang.reflect.Field;
import java.lang.reflect.Modifier;

import org.junit.After;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;

import br.com.softbox.thrust.test.lazy01.ALazyThread;

public class ThrustThreadControlTest {

	private Class<?> clazz;
	private Field field;

	@Before
	public void prepareAllTests() throws Exception {

		clazz = Class.forName("br.com.softbox.thrust.api.thread.ThrustThreadControl");
		Assert.assertNotNull(clazz);

		field = clazz.getDeclaredField("MAX_IDLE_TIMEOUT");
		Assert.assertNotNull(field);
		field.setAccessible(true);

		Field mf = Field.class.getDeclaredField("modifiers");
		mf.setAccessible(true);
		mf.setInt(field, field.getModifiers() & ~Modifier.FINAL);

		field.set(null, 1);
	}

	@After
	public void afterTest() throws Exception {
		field.set(null, 10);
	}

	@Test(timeout = 180000)
	public void testPoolWorkerControl() throws Exception {
		System.out.println("ThrustWorkerControlTest.testRemoveThread() - getting pool");
		final LocalWorkerThreadPool pool = ALazyThread.getPool();
		Assert.assertNotNull(pool);
		Assert.assertEquals(pool.getMinPoolSize(), 1);
		Assert.assertEquals(pool.getMaxPoolSize(), 2);

		System.out.println("ThrustWorkerControlTest.testRemoveThread() - getting worker 1");
		ThrustWorkerThread worker1 = pool.getThrustWorkerThread();
		Assert.assertNotNull(worker1);
		worker1.start();

		System.out.println("ThrustWorkerControlTest.testRemoveThread() - getting worker 2");
		ThrustWorkerThread worker2 = pool.getThrustWorkerThread();
		Assert.assertNotNull(worker2);
		worker2.start();

		System.out.println("ThrustWorkerControlTest.testRemoveThread() - Can I get 3rd worker?");
		ThrustWorkerThread worker3 = pool.getThrustWorkerThread();
		System.out.println("ThrustWorkerControlTest.testRemoveThread() - Has worker 3? " + (worker3 != null));
		Assert.assertNull(worker3);

		pool.returnThrustWorkerThread(null);

		System.out.println("ThrustWorkerControlTest.testRemoveThread() - Sleep");
		Thread.sleep(120099);

		System.out.println("ThrustWorkerControlTest.testRemoveThread() - Can I get 3rd worker, again?");
		worker3 = pool.getThrustWorkerThread();
		System.out.println("ThrustWorkerControlTest.testRemoveThread() - And now, has worker 3? " + (worker3 != null));
		Assert.assertNotNull(worker3);
		worker3.inactivate();
	}

}
