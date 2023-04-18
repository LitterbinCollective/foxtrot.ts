#include <iostream>
#include <napi.h>

#define CHUNK_SIZE 512
#define CORRUPT_EVERY_MAX 256

#define CORRUPT_MODE_SHIFT_L 1
#define CORRUPT_MODE_SHIFT_R 2
#define CORRUPT_MODE_OR 3
#define CORRUPT_MODE_AND 4
#define CORRUPT_MODE_XOR 5
#define CORRUPT_MODE_NOT 6

struct Readable {
  int16_t* data;
  size_t size;
  size_t pos;
};

struct Chunk {
  int16_t* data;
  size_t pos;
};

struct CorruptOptions {
  int16_t rand_sample;
  int16_t every;
  bool enabled;
};

class Mixer : public Napi::ObjectWrap<Mixer> {
  public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    Mixer(const Napi::CallbackInfo& info);

  private:
    std::vector<Readable> _readables;
    std::vector<Chunk> _chunks;

    int16_t _corrupt_rand_sample;
    int _corrupt_every;
    int _corrupt_pos;
    int _corrupt_mode;
    bool _corrupt_enabled;

    float _volume;
    void AddReadable(const Napi::CallbackInfo& info);
    void ClearReadables(const Napi::CallbackInfo& info);
    Napi::Value Process(const Napi::CallbackInfo& info);
    Napi::Value SetVolume(const Napi::CallbackInfo& info);
    Napi::Value GetVolume(const Napi::CallbackInfo& info);
    Napi::Value SetCorruptEnabled(const Napi::CallbackInfo& info);
    Napi::Value GetCorruptEnabled(const Napi::CallbackInfo& info);
    Napi::Value SetCorruptEvery(const Napi::CallbackInfo& info);
    Napi::Value GetCorruptEvery(const Napi::CallbackInfo& info);
    Napi::Value SetCorruptRandSample(const Napi::CallbackInfo& info);
    Napi::Value GetCorruptRandSample(const Napi::CallbackInfo& info);
    Napi::Value SetCorruptMode(const Napi::CallbackInfo& info);
    Napi::Value GetCorruptMode(const Napi::CallbackInfo& info);
};