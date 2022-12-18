#include <napi.h>

#define CHUNK_SIZE 512

struct Readable {
  int16_t* data;
  size_t size;
  size_t pos;
};

struct Chunk {
  int16_t* data;
  size_t pos;
};

class Mixer : public Napi::ObjectWrap<Mixer> {
  public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    Mixer(const Napi::CallbackInfo& info);

  private:
    std::vector<Readable> _readables;
    std::vector<Chunk> _chunks;
    float _volume;
    void AddReadable(const Napi::CallbackInfo& info);
    void ClearReadables(const Napi::CallbackInfo& info);
    Napi::Value Process(const Napi::CallbackInfo& info);
    Napi::Value SetVolume(const Napi::CallbackInfo& info);
    Napi::Value GetVolume(const Napi::CallbackInfo& info);
};