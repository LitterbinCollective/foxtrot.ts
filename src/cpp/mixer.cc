#include <iostream>
#include "mixer.h"

Napi::Object Mixer::Init(Napi::Env env, Napi::Object exports) {
  Napi::HandleScope scope(env);

  Napi::Function func = DefineClass(env, "Mixer", {
    InstanceMethod<&Mixer::AddReadable>("AddReadable", static_cast<napi_property_attributes>(napi_writable | napi_configurable)),
    InstanceMethod<&Mixer::ClearReadables>("ClearReadables", static_cast<napi_property_attributes>(napi_writable | napi_configurable)),
    InstanceMethod<&Mixer::Process>("Process", static_cast<napi_property_attributes>(napi_writable | napi_configurable)),
    InstanceMethod<&Mixer::SetVolume>("SetVolume", static_cast<napi_property_attributes>(napi_writable | napi_configurable)),
    InstanceMethod<&Mixer::GetVolume>("GetVolume", static_cast<napi_property_attributes>(napi_writable | napi_configurable)),
  });

  Napi::FunctionReference* constructor = new Napi::FunctionReference();
  *constructor = Napi::Persistent(func);

  exports.Set("Mixer", func);

  env.SetInstanceData<Napi::FunctionReference>(constructor);

  return exports;
}

Mixer::Mixer(const Napi::CallbackInfo& info) : Napi::ObjectWrap<Mixer>(info) {
  this->_volume = 1.0f;
}

Napi::Value Mixer::SetVolume(const Napi::CallbackInfo& info) {
  this->_volume = info[0].As<Napi::Number>().FloatValue();
  return this->GetVolume(info);
}

Napi::Value Mixer::GetVolume(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return Napi::Number::New(env, this->_volume);
}

void Mixer::AddReadable(const Napi::CallbackInfo& info) {
  Napi::Buffer<int16_t> value = info[0].As<Napi::Buffer<int16_t>>();

  Readable read_obj;
  read_obj.data = value.Data();
  read_obj.size = value.Length();
  read_obj.pos = 0;

  this->_readables.push_back(read_obj);
}

void Mixer::ClearReadables(const Napi::CallbackInfo& info) {
  this->_readables.clear();
}

Napi::Value Mixer::Process(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  Napi::Buffer<int16_t> value = info[0].As<Napi::Buffer<int16_t>>();
  int16_t* data = value.Data();
  size_t size = value.Length();

  float volume = 1 / (1 + static_cast<float>(this->_readables.size())) * this->_volume;

  for (size_t i = 0; i < size; i++) {
    int32_t sample = data[i];

    auto it = this->_readables.begin();
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
    }

    sample *= volume;
    if (sample >= std::numeric_limits<int16_t>::max())
      sample = std::numeric_limits<int16_t>::max();
    else if (sample <= std::numeric_limits<int16_t>::min())
      sample = std::numeric_limits<int16_t>::min();

    data[i] = sample;
  }

  Napi::Buffer<int16_t> returned = Napi::Buffer<int16_t>::Copy(env, data, size);

  return returned;
}

Napi::Object Initialize(Napi::Env env, Napi::Object exports) {
  return Mixer::Init(env, exports);
}

NODE_API_MODULE(NODE_GYP_MODULE_NAME, Initialize)