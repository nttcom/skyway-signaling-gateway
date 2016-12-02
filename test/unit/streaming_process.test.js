const streaming_process = require('../../libs/miscs/streaming_process')

beforeEach( () => {
  return streaming_process._stop()
});

describe('_start', () => {
  it('shold start process when there is no childProcess', () => {
    expect(streaming_process._start()).toBe(true)
  });

  it('should not start process when there is already childProcess working', () => {
    streaming_process._start()
    expect(streaming_process._start()).toBe(false)
  });
});

describe('_stop', () => {
  it('should resolv promise with true when process exists', () => {
    streaming_process._start()
    streaming_process._stop().then( ret => {
      expect(ret).toBe(true)
    });
  });

  it('shold resolv promise with false when process is not exist', () => {
    streaming_process._stop().then( ret => {
      expect(ret).toBe(false)
    });
  });
});



describe('attempt_to_start', () => {
  it('should start process when there is not', () => {
    expect(streaming_process.attempt_to_start()).toBe(true)
  });

  it('should not start process when there is already', () => {
    streaming_process._start()

    expect(streaming_process.attempt_to_start()).toBe(false)
  });
});

describe('stop_if_no_streaming', () => {
  it('should stop process when there are no streaming client', () => {
    let connections = {'123': {'plugin': 'skywayiot'}};
    streaming_process.stop_if_no_streaming(connections).then( ret => {
      expect(ret).toBe(false)
    });
  });

  it('should not stop process when there are streaming client', () => {
    let connections = {'123': {'plugin': 'streaming'}};
    streaming_process.stop_if_no_streaming(connections).then( ret => {
      expect(ret).toBe(true)
    });
  });
})

describe('_check_if_streaming_client_exist', () => {
  it('should return true if connections object contains plugin of streaming', () => {
    let connections = {'123': {'plugin': 'streaming'}}
    expect( streaming_process._check_if_streaming_client_exist(connections)).toBe(true);
  });

  it('should return false if connections object does not contain plugin of streaming', () => {
    let connections = {'123': {'plugin': 'skywayiot'}}
    expect( streaming_process._check_if_streaming_client_exist(connections)).toBe(false)
  });
});

