/*
  the project had multiple iterations of a PCM mixer in JavaScript,
  but JavaScript is slow, so we have to rely on a C++ module, which
  is more performant.
*/
#include <iostream>
#include <cstdlib>
#include <cmath>
#include "mixer.h"

Napi::Object Mixer::Init(Napi::Env env, Napi::Object exports) {
  Napi::HandleScope scope(env);

  Napi::Function func = DefineClass(env, "Mixer", {
    InstanceMethod<&Mixer::AddReadable>("addReadable", static_cast<napi_property_attributes>(napi_writable | napi_configurable)),
    InstanceMethod<&Mixer::ClearReadables>("clearReadables", static_cast<napi_property_attributes>(napi_writable | napi_configurable)),
    InstanceMethod<&Mixer::Process>("process", static_cast<napi_property_attributes>(napi_writable | napi_configurable)),
    InstanceMethod<&Mixer::GetVolume>("getVolume", static_cast<napi_property_attributes>(napi_writable | napi_configurable)),
    InstanceMethod<&Mixer::SetVolume>("setVolume", static_cast<napi_property_attributes>(napi_writable | napi_configurable)),
    InstanceMethod<&Mixer::GetCorruptEnabled>("getCorruptEnabled", static_cast<napi_property_attributes>(napi_writable | napi_configurable)),
    InstanceMethod<&Mixer::SetCorruptEnabled>("setCorruptEnabled", static_cast<napi_property_attributes>(napi_writable | napi_configurable)),
    InstanceMethod<&Mixer::GetCorruptEvery>("getCorruptEvery", static_cast<napi_property_attributes>(napi_writable | napi_configurable)),
    InstanceMethod<&Mixer::SetCorruptEvery>("setCorruptEvery", static_cast<napi_property_attributes>(napi_writable | napi_configurable)),
    InstanceMethod<&Mixer::GetCorruptRandSample>("getCorruptRandSample", static_cast<napi_property_attributes>(napi_writable | napi_configurable)),
    InstanceMethod<&Mixer::SetCorruptRandSample>("setCorruptRandSample", static_cast<napi_property_attributes>(napi_writable | napi_configurable)),
    InstanceMethod<&Mixer::GetCorruptMode>("getCorruptMode", static_cast<napi_property_attributes>(napi_writable | napi_configurable)),
    InstanceMethod<&Mixer::SetCorruptMode>("setCorruptMode", static_cast<napi_property_attributes>(napi_writable | napi_configurable)),
  });

  Napi::FunctionReference* constructor = new Napi::FunctionReference();
  *constructor = Napi::Persistent(func);

  exports.Set("Mixer", func);

  env.SetInstanceData<Napi::FunctionReference>(constructor);

  return exports;
}

Mixer::Mixer(const Napi::CallbackInfo& info) : Napi::ObjectWrap<Mixer>(info) {
  this->_volume = 1;
  this->_corrupt_enabled = false;
  this->_corrupt_every = 8;
  this->_corrupt_rand_sample = 0;
  this->_corrupt_pos = 0;
  srand(time(NULL));
}

Napi::Value Mixer::SetVolume(const Napi::CallbackInfo& info) {
  this->_volume = info[0].As<Napi::Number>().FloatValue();
  return this->GetVolume(info);
}

Napi::Value Mixer::GetVolume(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return Napi::Number::New(env, this->_volume);
}

Napi::Value Mixer::SetCorruptRandSample(const Napi::CallbackInfo& info) {
  this->_corrupt_rand_sample = info[0].As<Napi::Number>().Int64Value();
  return this->GetCorruptRandSample(info);
}

Napi::Value Mixer::GetCorruptRandSample(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return Napi::Number::New(env, this->_corrupt_rand_sample);
}

Napi::Value Mixer::SetCorruptEvery(const Napi::CallbackInfo& info) {
  this->_corrupt_every = info[0].As<Napi::Number>().Int64Value();
  if (this->_corrupt_every < 1)
    this->_corrupt_every = 1;
  if (this->_corrupt_every > CORRUPT_EVERY_MAX)
    this->_corrupt_every = CORRUPT_EVERY_MAX;
  return this->GetCorruptEvery(info);
}

Napi::Value Mixer::GetCorruptEvery(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return Napi::Number::New(env, this->_corrupt_every);
}

Napi::Value Mixer::SetCorruptEnabled(const Napi::CallbackInfo& info) {
  this->_corrupt_enabled = info[0].As<Napi::Boolean>().Value();
  return this->GetCorruptEnabled(info);
}

Napi::Value Mixer::GetCorruptEnabled(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return Napi::Boolean::New(env, this->_corrupt_enabled);
}

Napi::Value Mixer::SetCorruptMode(const Napi::CallbackInfo& info) {
  this->_corrupt_mode = static_cast<CorruptMode>(info[0].As<Napi::Number>().Int32Value());
  return this->GetCorruptMode(info);
}

Napi::Value Mixer::GetCorruptMode(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return Napi::Number::New(env, this->_corrupt_mode);
}

void Mixer::AddReadable(const Napi::CallbackInfo& info) {
  Napi::Buffer<int16_t> value = info[0].As<Napi::Buffer<int16_t>>();
  int16_t* data = value.Data();
  size_t size = value.Length();

  /*
    splitting audio into bite-sized pieces so it will not cause
    an undefined behavior or memory leaks.

    this is still bound to break at one point, right?
  */
  for (size_t i = 0; i < round(size / CHUNK_SIZE); i++) {
    Chunk chunk;

    if (i >= this->_chunks.size()) {
      chunk.data = new int16_t[CHUNK_SIZE];
      std::fill(chunk.data, chunk.data + CHUNK_SIZE, 0);
      chunk.pos = 0;
      this->_chunks.push_back(chunk);
    } else {
      chunk = this->_chunks.at(i);
    }

    for (size_t k = 0; k < CHUNK_SIZE; k++) {
      size_t offset = k + i * CHUNK_SIZE;
      if (offset >= size)
        break;
      int16_t sample = data[offset];
      int32_t new_sample = chunk.data[k] + sample;
      if (new_sample >= std::numeric_limits<int16_t>::max())
        new_sample = std::numeric_limits<int16_t>::max();
      if (new_sample <= std::numeric_limits<int16_t>::min())
        new_sample = std::numeric_limits<int16_t>::min();
      chunk.data[k] = new_sample;
    }
  }
}

void Mixer::ClearReadables(const Napi::CallbackInfo& info) {
  this->_chunks.clear();
}

Napi::Value Mixer::Process(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  Napi::Buffer<int16_t> value = info[0].As<Napi::Buffer<int16_t>>();
  int16_t* data = value.Data();
  size_t size = value.Length();

  float volume = this->_volume;

  for (size_t i = 0; i < size; i += 2) {
    int32_t sample_l = data[i];
    int32_t sample_r = data[i + 1];

    /*auto it = this->_readables.begin();
    for (; it != this->_readables.end();) {
      Readable read_obj = *it;

      if (read_obj.pos >= read_obj.size) {
        it = this->_readables.erase(it);
        continue;
      }

      int32_t readable_sample = read_obj.data[read_obj.pos];
      sample += readable_sample;
      (*it).pos++;
      ++it;
    }*/

    auto it = this->_chunks.begin();
    if (it != this->_chunks.end()) {
      Chunk chunk = *it;
      // std::cout << i << " " << chunk.pos << " " << CHUNK_SIZE << std::endl;
      int16_t chunk_sample_l = chunk.data[chunk.pos];
      int16_t chunk_sample_r = chunk.data[chunk.pos + 1];

      sample_l = sample_l + chunk_sample_l;
      sample_r = sample_r + chunk_sample_r;

      if (chunk.pos + 2 >= CHUNK_SIZE)
        this->_chunks.erase(it);
      else
        (*it).pos += 2;
    }

    this->_corrupt_pos++;
    if (this->_corrupt_pos >= this->_corrupt_every) {
      if (this->_corrupt_enabled) {
        int16_t rand_sample = this->_corrupt_rand_sample;
        if (rand_sample == 0)
          rand_sample = rand() % std::numeric_limits<int16_t>::max();
        switch (this->_corrupt_mode) {
          case CorruptMode::c_shift_l:
            sample_l = sample_l << rand_sample;
            sample_r = sample_r << rand_sample;
            break;
          case CorruptMode::c_shift_r:
            sample_l = sample_l >> rand_sample;
            sample_r = sample_r >> rand_sample;
            break;
          case CorruptMode::c_or:
            sample_l = sample_l | rand_sample;
            sample_r = sample_r | rand_sample;
            break;
          case CorruptMode::c_and:
            sample_l = sample_l & rand_sample;
            sample_r = sample_r & rand_sample;
            break;
          case CorruptMode::c_xor:
            sample_l = sample_l ^ rand_sample;
            sample_r = sample_r ^ rand_sample;
            break;
          case CorruptMode::c_not:
            sample_l = ~sample_l;
            sample_r = ~sample_r;
            break;
          default:
            sample_l += rand_sample;
            sample_r += rand_sample;
            break;
        }
      }
      this->_corrupt_pos = 0;
    }

    sample_l *= volume;
    if (sample_l >= std::numeric_limits<int16_t>::max())
      sample_l = std::numeric_limits<int16_t>::max();
    if (sample_l <= std::numeric_limits<int16_t>::min())
      sample_l = std::numeric_limits<int16_t>::min();

    sample_r *= volume;
    if (sample_r >= std::numeric_limits<int16_t>::max())
      sample_r = std::numeric_limits<int16_t>::max();
    if (sample_r <= std::numeric_limits<int16_t>::min())
      sample_r = std::numeric_limits<int16_t>::min();

    data[i] = sample_l;
    data[i + 1] = sample_r;
  }

  Napi::Buffer<int16_t> returned = Napi::Buffer<int16_t>::Copy(env, data, size);

  return returned;
}

Napi::Object Initialize(Napi::Env env, Napi::Object exports) {
  return Mixer::Init(env, exports);
}

NODE_API_MODULE(NODE_GYP_MODULE_NAME, Initialize)