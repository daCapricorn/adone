// This is a generated file, modify: generate/templates/templates/class_content.cc

#include <nan.h>
#include <string.h>

extern "C" {
  #include <git2.h>
 }

#include "../include/nodegit.h"
#include "../include/lock_master.h"
#include "../include/functions/copy.h"
#include "../include/submodule.h"
#include "nodegit_wrapper.cc"
#include "../include/async_libgit2_queue_worker.h"

  #include "../include/repository.h"
  #include "../include/oid.h"
  #include "../include/buf.h"
  #include "../include/submodule_update_options.h"
 
#include <iostream>

using namespace std;
using namespace v8;
using namespace node;

  GitSubmodule::~GitSubmodule() {
    // this will cause an error if you have a non-self-freeing object that also needs
    // to save values. Since the object that will eventually free the object has no
    // way of knowing to free these values.
                                                                                                                                    }

  void GitSubmodule::InitializeComponent(v8::Local<v8::Object> target) {
    Nan::HandleScope scope;

    v8::Local<FunctionTemplate> tpl = Nan::New<FunctionTemplate>(JSNewFunction);

    tpl->InstanceTemplate()->SetInternalFieldCount(1);
    tpl->SetClassName(Nan::New("Submodule").ToLocalChecked());

          Nan::SetPrototypeMethod(tpl, "addFinalize", AddFinalize);
             Nan::SetMethod(tpl, "addSetup", AddSetup);
            Nan::SetPrototypeMethod(tpl, "addToIndex", AddToIndex);
            Nan::SetPrototypeMethod(tpl, "branch", Branch);
            Nan::SetPrototypeMethod(tpl, "fetchRecurseSubmodules", FetchRecurseSubmodules);
             Nan::SetMethod(tpl, "foreach", Foreach);
            Nan::SetPrototypeMethod(tpl, "free", Free);
            Nan::SetPrototypeMethod(tpl, "headId", HeadId);
            Nan::SetPrototypeMethod(tpl, "ignore", Ignore);
            Nan::SetPrototypeMethod(tpl, "indexId", IndexId);
            Nan::SetPrototypeMethod(tpl, "init", Init);
            Nan::SetPrototypeMethod(tpl, "location", Location);
             Nan::SetMethod(tpl, "lookup", Lookup);
            Nan::SetPrototypeMethod(tpl, "name", Name);
            Nan::SetPrototypeMethod(tpl, "open", Open);
            Nan::SetPrototypeMethod(tpl, "owner", Owner);
            Nan::SetPrototypeMethod(tpl, "path", Path);
            Nan::SetPrototypeMethod(tpl, "reload", Reload);
            Nan::SetPrototypeMethod(tpl, "repoInit", RepoInit);
             Nan::SetMethod(tpl, "resolveUrl", ResolveUrl);
             Nan::SetMethod(tpl, "setBranch", SetBranch);
             Nan::SetMethod(tpl, "setFetchRecurseSubmodules", SetFetchRecurseSubmodules);
             Nan::SetMethod(tpl, "setIgnore", SetIgnore);
             Nan::SetMethod(tpl, "setUpdate", SetUpdate);
             Nan::SetMethod(tpl, "setUrl", SetUrl);
             Nan::SetMethod(tpl, "status", Status);
            Nan::SetPrototypeMethod(tpl, "sync", Sync);
            Nan::SetPrototypeMethod(tpl, "update", Update);
             Nan::SetMethod(tpl, "updateInitOptions", UpdateInitOptions);
            Nan::SetPrototypeMethod(tpl, "updateStrategy", UpdateStrategy);
            Nan::SetPrototypeMethod(tpl, "url", Url);
            Nan::SetPrototypeMethod(tpl, "wdId", WdId);
    
    InitializeTemplate(tpl);

    v8::Local<Function> _constructor_template = Nan::GetFunction(tpl).ToLocalChecked();
    constructor_template.Reset(_constructor_template);
    Nan::Set(target, Nan::New("Submodule").ToLocalChecked(), _constructor_template);
  }

 
/*
     */
NAN_METHOD(GitSubmodule::AddFinalize) {

  if (info.Length() == 0 || !info[0]->IsFunction()) {
    return Nan::ThrowError("Callback is required and must be a Function.");
  }

  AddFinalizeBaton* baton = new AddFinalizeBaton;

  baton->error_code = GIT_OK;
  baton->error = NULL;

  baton->submodule = Nan::ObjectWrap::Unwrap<GitSubmodule>(info.This())->GetValue();

  Nan::Callback *callback = new Nan::Callback(v8::Local<Function>::Cast(info[0]));
  AddFinalizeWorker *worker = new AddFinalizeWorker(baton, callback);
  worker->SaveToPersistent("submodule", info.This());

  AsyncLibgit2QueueWorker(worker);
  return;
}

void GitSubmodule::AddFinalizeWorker::Execute() {
  giterr_clear();

  {
    LockMaster lockMaster(/*asyncAction: */true        ,baton->submodule
);

  int result = git_submodule_add_finalize(
baton->submodule    );

    baton->error_code = result;

    if (result != GIT_OK && giterr_last() != NULL) {
      baton->error = git_error_dup(giterr_last());
    }

  }
}

void GitSubmodule::AddFinalizeWorker::HandleOKCallback() {
  if (baton->error_code == GIT_OK) {
    v8::Local<v8::Value> result = Nan::Undefined();
    v8::Local<v8::Value> argv[2] = {
      Nan::Null(),
      result
    };
    callback->Call(2, argv);
  } else {
    if (baton->error) {
      v8::Local<v8::Object> err;
      if (baton->error->message) {
        err = Nan::Error(baton->error->message)->ToObject();
      } else {
        err = Nan::Error("Method addFinalize has thrown an error.")->ToObject();
      }
      err->Set(Nan::New("errno").ToLocalChecked(), Nan::New(baton->error_code));
      v8::Local<v8::Value> argv[1] = {
        err
      };
      callback->Call(1, argv);
      if (baton->error->message)
        free((void *)baton->error->message);
      free((void *)baton->error);
    } else if (baton->error_code < 0) {
      std::queue< v8::Local<v8::Value> > workerArguments;
      bool callbackFired = false;
      while(!workerArguments.empty()) {
        v8::Local<v8::Value> node = workerArguments.front();
        workerArguments.pop();

        if (
          !node->IsObject()
          || node->IsArray()
          || node->IsBooleanObject()
          || node->IsDate()
          || node->IsFunction()
          || node->IsNumberObject()
          || node->IsRegExp()
          || node->IsStringObject()
        ) {
          continue;
        }

        v8::Local<v8::Object> nodeObj = node->ToObject();
        v8::Local<v8::Value> checkValue = GetPrivate(nodeObj, Nan::New("NodeGitPromiseError").ToLocalChecked());

        if (!checkValue.IsEmpty() && !checkValue->IsNull() && !checkValue->IsUndefined()) {
          v8::Local<v8::Value> argv[1] = {
            checkValue->ToObject()
          };
          callback->Call(1, argv);
          callbackFired = true;
          break;
        }

        v8::Local<v8::Array> properties = nodeObj->GetPropertyNames();
        for (unsigned int propIndex = 0; propIndex < properties->Length(); ++propIndex) {
          v8::Local<v8::String> propName = properties->Get(propIndex)->ToString();
          v8::Local<v8::Value> nodeToQueue = nodeObj->Get(propName);
          if (!nodeToQueue->IsUndefined()) {
            workerArguments.push(nodeToQueue);
          }
        }
      }

      if (!callbackFired) {
        v8::Local<v8::Object> err = Nan::Error("Method addFinalize has thrown an error.")->ToObject();
        err->Set(Nan::New("errno").ToLocalChecked(), Nan::New(baton->error_code));
        v8::Local<v8::Value> argv[1] = {
          err
        };
        callback->Call(1, argv);
      }
    } else {
      callback->Call(0, NULL);
    }

  }


  delete baton;
}

  
/*
  * @param Repository repo
   * @param String url
   * @param String path
   * @param Number use_gitlink
    * @param Submodule callback
   */
NAN_METHOD(GitSubmodule::AddSetup) {

  if (info.Length() == 0 || !info[0]->IsObject()) {
    return Nan::ThrowError("Repository repo is required.");
  }

  if (info.Length() == 1 || !info[1]->IsString()) {
    return Nan::ThrowError("String url is required.");
  }

  if (info.Length() == 2 || !info[2]->IsString()) {
    return Nan::ThrowError("String path is required.");
  }

  if (info.Length() == 3 || !info[3]->IsNumber()) {
    return Nan::ThrowError("Number use_gitlink is required.");
  }

  if (info.Length() == 4 || !info[4]->IsFunction()) {
    return Nan::ThrowError("Callback is required and must be a Function.");
  }

  AddSetupBaton* baton = new AddSetupBaton;

  baton->error_code = GIT_OK;
  baton->error = NULL;

// start convert_from_v8 block
  git_repository * from_repo = NULL;
from_repo = Nan::ObjectWrap::Unwrap<GitRepository>(info[0]->ToObject())->GetValue();
// end convert_from_v8 block
  baton->repo = from_repo;
// start convert_from_v8 block
  const char * from_url = NULL;

  String::Utf8Value url(info[1]->ToString());
  // malloc with one extra byte so we can add the terminating null character C-strings expect:
  from_url = (const char *) malloc(url.length() + 1);
  // copy the characters from the nodejs string into our C-string (used instead of strdup or strcpy because nulls in
  // the middle of strings are valid coming from nodejs):
  memcpy((void *)from_url, *url, url.length());
  // ensure the final byte of our new string is null, extra casts added to ensure compatibility with various C types
  // used in the nodejs binding generation:
  memset((void *)(((char *)from_url) + url.length()), 0, 1);
// end convert_from_v8 block
  baton->url = from_url;
// start convert_from_v8 block
  const char * from_path = NULL;

  String::Utf8Value path(info[2]->ToString());
  // malloc with one extra byte so we can add the terminating null character C-strings expect:
  from_path = (const char *) malloc(path.length() + 1);
  // copy the characters from the nodejs string into our C-string (used instead of strdup or strcpy because nulls in
  // the middle of strings are valid coming from nodejs):
  memcpy((void *)from_path, *path, path.length());
  // ensure the final byte of our new string is null, extra casts added to ensure compatibility with various C types
  // used in the nodejs binding generation:
  memset((void *)(((char *)from_path) + path.length()), 0, 1);
// end convert_from_v8 block
  baton->path = from_path;
// start convert_from_v8 block
  int from_use_gitlink;
  from_use_gitlink = (int)   info[3]->ToNumber()->Value();
// end convert_from_v8 block
  baton->use_gitlink = from_use_gitlink;

  Nan::Callback *callback = new Nan::Callback(v8::Local<Function>::Cast(info[4]));
  AddSetupWorker *worker = new AddSetupWorker(baton, callback);
  if (!info[0]->IsUndefined() && !info[0]->IsNull())
    worker->SaveToPersistent("repo", info[0]->ToObject());
  if (!info[1]->IsUndefined() && !info[1]->IsNull())
    worker->SaveToPersistent("url", info[1]->ToObject());
  if (!info[2]->IsUndefined() && !info[2]->IsNull())
    worker->SaveToPersistent("path", info[2]->ToObject());
  if (!info[3]->IsUndefined() && !info[3]->IsNull())
    worker->SaveToPersistent("use_gitlink", info[3]->ToObject());

  AsyncLibgit2QueueWorker(worker);
  return;
}

void GitSubmodule::AddSetupWorker::Execute() {
  giterr_clear();

  {
    LockMaster lockMaster(/*asyncAction: */true        ,baton->repo
        ,baton->url
        ,baton->path
);

  int result = git_submodule_add_setup(
&baton->out,baton->repo,baton->url,baton->path,baton->use_gitlink    );

    baton->error_code = result;

    if (result != GIT_OK && giterr_last() != NULL) {
      baton->error = git_error_dup(giterr_last());
    }

  }
}

void GitSubmodule::AddSetupWorker::HandleOKCallback() {
  if (baton->error_code == GIT_OK) {
    v8::Local<v8::Value> to;
// start convert_to_v8 block
  
  if (baton->out != NULL) {
    // GitSubmodule baton->out
       to = GitSubmodule::New(baton->out, false  );
   }
  else {
    to = Nan::Null();
  }

 // end convert_to_v8 block
    v8::Local<v8::Value> result = to;
    v8::Local<v8::Value> argv[2] = {
      Nan::Null(),
      result
    };
    callback->Call(2, argv);
  } else {
    if (baton->error) {
      v8::Local<v8::Object> err;
      if (baton->error->message) {
        err = Nan::Error(baton->error->message)->ToObject();
      } else {
        err = Nan::Error("Method addSetup has thrown an error.")->ToObject();
      }
      err->Set(Nan::New("errno").ToLocalChecked(), Nan::New(baton->error_code));
      v8::Local<v8::Value> argv[1] = {
        err
      };
      callback->Call(1, argv);
      if (baton->error->message)
        free((void *)baton->error->message);
      free((void *)baton->error);
    } else if (baton->error_code < 0) {
      std::queue< v8::Local<v8::Value> > workerArguments;
      workerArguments.push(GetFromPersistent("repo"));
      workerArguments.push(GetFromPersistent("url"));
      workerArguments.push(GetFromPersistent("path"));
      workerArguments.push(GetFromPersistent("use_gitlink"));
      bool callbackFired = false;
      while(!workerArguments.empty()) {
        v8::Local<v8::Value> node = workerArguments.front();
        workerArguments.pop();

        if (
          !node->IsObject()
          || node->IsArray()
          || node->IsBooleanObject()
          || node->IsDate()
          || node->IsFunction()
          || node->IsNumberObject()
          || node->IsRegExp()
          || node->IsStringObject()
        ) {
          continue;
        }

        v8::Local<v8::Object> nodeObj = node->ToObject();
        v8::Local<v8::Value> checkValue = GetPrivate(nodeObj, Nan::New("NodeGitPromiseError").ToLocalChecked());

        if (!checkValue.IsEmpty() && !checkValue->IsNull() && !checkValue->IsUndefined()) {
          v8::Local<v8::Value> argv[1] = {
            checkValue->ToObject()
          };
          callback->Call(1, argv);
          callbackFired = true;
          break;
        }

        v8::Local<v8::Array> properties = nodeObj->GetPropertyNames();
        for (unsigned int propIndex = 0; propIndex < properties->Length(); ++propIndex) {
          v8::Local<v8::String> propName = properties->Get(propIndex)->ToString();
          v8::Local<v8::Value> nodeToQueue = nodeObj->Get(propName);
          if (!nodeToQueue->IsUndefined()) {
            workerArguments.push(nodeToQueue);
          }
        }
      }

      if (!callbackFired) {
        v8::Local<v8::Object> err = Nan::Error("Method addSetup has thrown an error.")->ToObject();
        err->Set(Nan::New("errno").ToLocalChecked(), Nan::New(baton->error_code));
        v8::Local<v8::Value> argv[1] = {
          err
        };
        callback->Call(1, argv);
      }
    } else {
      callback->Call(0, NULL);
    }

  }


  delete baton;
}

  
/*
   * @param Number write_index
     */
NAN_METHOD(GitSubmodule::AddToIndex) {

  if (info.Length() == 0 || !info[0]->IsNumber()) {
    return Nan::ThrowError("Number write_index is required.");
  }

  if (info.Length() == 1 || !info[1]->IsFunction()) {
    return Nan::ThrowError("Callback is required and must be a Function.");
  }

  AddToIndexBaton* baton = new AddToIndexBaton;

  baton->error_code = GIT_OK;
  baton->error = NULL;

  baton->submodule = Nan::ObjectWrap::Unwrap<GitSubmodule>(info.This())->GetValue();
// start convert_from_v8 block
  int from_write_index;
  from_write_index = (int)   info[0]->ToNumber()->Value();
// end convert_from_v8 block
  baton->write_index = from_write_index;

  Nan::Callback *callback = new Nan::Callback(v8::Local<Function>::Cast(info[1]));
  AddToIndexWorker *worker = new AddToIndexWorker(baton, callback);
  worker->SaveToPersistent("submodule", info.This());
  if (!info[0]->IsUndefined() && !info[0]->IsNull())
    worker->SaveToPersistent("write_index", info[0]->ToObject());

  AsyncLibgit2QueueWorker(worker);
  return;
}

void GitSubmodule::AddToIndexWorker::Execute() {
  giterr_clear();

  {
    LockMaster lockMaster(/*asyncAction: */true        ,baton->submodule
);

  int result = git_submodule_add_to_index(
baton->submodule,baton->write_index    );

    baton->error_code = result;

    if (result != GIT_OK && giterr_last() != NULL) {
      baton->error = git_error_dup(giterr_last());
    }

  }
}

void GitSubmodule::AddToIndexWorker::HandleOKCallback() {
  if (baton->error_code == GIT_OK) {
    v8::Local<v8::Value> result = Nan::Undefined();
    v8::Local<v8::Value> argv[2] = {
      Nan::Null(),
      result
    };
    callback->Call(2, argv);
  } else {
    if (baton->error) {
      v8::Local<v8::Object> err;
      if (baton->error->message) {
        err = Nan::Error(baton->error->message)->ToObject();
      } else {
        err = Nan::Error("Method addToIndex has thrown an error.")->ToObject();
      }
      err->Set(Nan::New("errno").ToLocalChecked(), Nan::New(baton->error_code));
      v8::Local<v8::Value> argv[1] = {
        err
      };
      callback->Call(1, argv);
      if (baton->error->message)
        free((void *)baton->error->message);
      free((void *)baton->error);
    } else if (baton->error_code < 0) {
      std::queue< v8::Local<v8::Value> > workerArguments;
      workerArguments.push(GetFromPersistent("write_index"));
      bool callbackFired = false;
      while(!workerArguments.empty()) {
        v8::Local<v8::Value> node = workerArguments.front();
        workerArguments.pop();

        if (
          !node->IsObject()
          || node->IsArray()
          || node->IsBooleanObject()
          || node->IsDate()
          || node->IsFunction()
          || node->IsNumberObject()
          || node->IsRegExp()
          || node->IsStringObject()
        ) {
          continue;
        }

        v8::Local<v8::Object> nodeObj = node->ToObject();
        v8::Local<v8::Value> checkValue = GetPrivate(nodeObj, Nan::New("NodeGitPromiseError").ToLocalChecked());

        if (!checkValue.IsEmpty() && !checkValue->IsNull() && !checkValue->IsUndefined()) {
          v8::Local<v8::Value> argv[1] = {
            checkValue->ToObject()
          };
          callback->Call(1, argv);
          callbackFired = true;
          break;
        }

        v8::Local<v8::Array> properties = nodeObj->GetPropertyNames();
        for (unsigned int propIndex = 0; propIndex < properties->Length(); ++propIndex) {
          v8::Local<v8::String> propName = properties->Get(propIndex)->ToString();
          v8::Local<v8::Value> nodeToQueue = nodeObj->Get(propName);
          if (!nodeToQueue->IsUndefined()) {
            workerArguments.push(nodeToQueue);
          }
        }
      }

      if (!callbackFired) {
        v8::Local<v8::Object> err = Nan::Error("Method addToIndex has thrown an error.")->ToObject();
        err->Set(Nan::New("errno").ToLocalChecked(), Nan::New(baton->error_code));
        v8::Local<v8::Value> argv[1] = {
          err
        };
        callback->Call(1, argv);
      }
    } else {
      callback->Call(0, NULL);
    }

  }


  delete baton;
}

   
/*
     * @return String  result    */
NAN_METHOD(GitSubmodule::Branch) {
  Nan::EscapableHandleScope scope;

 
  giterr_clear();

  {
    LockMaster lockMaster(/*asyncAction: */false        ,    Nan::ObjectWrap::Unwrap<GitSubmodule>(info.This())->GetValue()
);

    const char * result = git_submodule_branch(
  Nan::ObjectWrap::Unwrap<GitSubmodule>(info.This())->GetValue()
    );

     // null checks on pointers
    if (!result) {
      return info.GetReturnValue().Set(scope.Escape(Nan::Undefined()));
    }

    v8::Local<v8::Value> to;
// start convert_to_v8 block
  if (result){
       to = Nan::New<String>(result).ToLocalChecked();
   }
  else {
    to = Nan::Null();
  }

  // end convert_to_v8 block
    return info.GetReturnValue().Set(scope.Escape(to));
  }
}
   
/*
     * @return Number  result    */
NAN_METHOD(GitSubmodule::FetchRecurseSubmodules) {
  Nan::EscapableHandleScope scope;

 
  giterr_clear();

  {
    LockMaster lockMaster(/*asyncAction: */false        ,    Nan::ObjectWrap::Unwrap<GitSubmodule>(info.This())->GetValue()
);

    git_submodule_recurse_t result = git_submodule_fetch_recurse_submodules(
  Nan::ObjectWrap::Unwrap<GitSubmodule>(info.This())->GetValue()
    );

 
    v8::Local<v8::Value> to;
// start convert_to_v8 block
     to = Nan::New<Number>( result);
  // end convert_to_v8 block
    return info.GetReturnValue().Set(scope.Escape(to));
  }
}
  
/*
 * @param Repository repo
   * @param SubmoduleCb callback
   * @param Void payload
     */
NAN_METHOD(GitSubmodule::Foreach) {

  if (info.Length() == 0 || !info[0]->IsObject()) {
    return Nan::ThrowError("Repository repo is required.");
  }

  if (info.Length() == 1 || !info[1]->IsFunction()) {
    return Nan::ThrowError("SubmoduleCb callback is required.");
  }
  if (info.Length() == 3 || !info[3]->IsFunction()) {
    return Nan::ThrowError("Callback is required and must be a Function.");
  }

  ForeachBaton* baton = new ForeachBaton;

  baton->error_code = GIT_OK;
  baton->error = NULL;

  Foreach_globalPayload* globalPayload = new Foreach_globalPayload;
// start convert_from_v8 block
  git_repository * from_repo = NULL;
from_repo = Nan::ObjectWrap::Unwrap<GitRepository>(info[0]->ToObject())->GetValue();
// end convert_from_v8 block
  baton->repo = from_repo;
  if (!info[1]->IsFunction()) {
    baton->callback = NULL;
    globalPayload->callback = NULL;
  }
  else {
    baton->callback = Foreach_callback_cppCallback;
    globalPayload->callback = new Nan::Callback(info[1].As<Function>());
  }
  baton->payload = globalPayload;

  Nan::Callback *callback = new Nan::Callback(v8::Local<Function>::Cast(info[3]));
  ForeachWorker *worker = new ForeachWorker(baton, callback);
  if (!info[0]->IsUndefined() && !info[0]->IsNull())
    worker->SaveToPersistent("repo", info[0]->ToObject());
  if (!info[2]->IsUndefined() && !info[2]->IsNull())
    worker->SaveToPersistent("payload", info[2]->ToObject());

  AsyncLibgit2QueueWorker(worker);
  return;
}

void GitSubmodule::ForeachWorker::Execute() {
  giterr_clear();

  {
    LockMaster lockMaster(/*asyncAction: */true        ,baton->repo
        ,baton->payload
);

  int result = git_submodule_foreach(
baton->repo,baton->callback,baton->payload    );

    baton->error_code = result;

    if (result != GIT_OK && giterr_last() != NULL) {
      baton->error = git_error_dup(giterr_last());
    }

  }
}

void GitSubmodule::ForeachWorker::HandleOKCallback() {
  if (baton->error_code == GIT_OK) {
    v8::Local<v8::Value> result = Nan::Undefined();
    v8::Local<v8::Value> argv[2] = {
      Nan::Null(),
      result
    };
    callback->Call(2, argv);
  } else {
    if (baton->error) {
      v8::Local<v8::Object> err;
      if (baton->error->message) {
        err = Nan::Error(baton->error->message)->ToObject();
      } else {
        err = Nan::Error("Method foreach has thrown an error.")->ToObject();
      }
      err->Set(Nan::New("errno").ToLocalChecked(), Nan::New(baton->error_code));
      v8::Local<v8::Value> argv[1] = {
        err
      };
      callback->Call(1, argv);
      if (baton->error->message)
        free((void *)baton->error->message);
      free((void *)baton->error);
    } else if (baton->error_code < 0) {
      std::queue< v8::Local<v8::Value> > workerArguments;
      workerArguments.push(GetFromPersistent("repo"));
      workerArguments.push(GetFromPersistent("payload"));
      bool callbackFired = false;
      while(!workerArguments.empty()) {
        v8::Local<v8::Value> node = workerArguments.front();
        workerArguments.pop();

        if (
          !node->IsObject()
          || node->IsArray()
          || node->IsBooleanObject()
          || node->IsDate()
          || node->IsFunction()
          || node->IsNumberObject()
          || node->IsRegExp()
          || node->IsStringObject()
        ) {
          continue;
        }

        v8::Local<v8::Object> nodeObj = node->ToObject();
        v8::Local<v8::Value> checkValue = GetPrivate(nodeObj, Nan::New("NodeGitPromiseError").ToLocalChecked());

        if (!checkValue.IsEmpty() && !checkValue->IsNull() && !checkValue->IsUndefined()) {
          v8::Local<v8::Value> argv[1] = {
            checkValue->ToObject()
          };
          callback->Call(1, argv);
          callbackFired = true;
          break;
        }

        v8::Local<v8::Array> properties = nodeObj->GetPropertyNames();
        for (unsigned int propIndex = 0; propIndex < properties->Length(); ++propIndex) {
          v8::Local<v8::String> propName = properties->Get(propIndex)->ToString();
          v8::Local<v8::Value> nodeToQueue = nodeObj->Get(propName);
          if (!nodeToQueue->IsUndefined()) {
            workerArguments.push(nodeToQueue);
          }
        }
      }

      if (!callbackFired) {
        v8::Local<v8::Object> err = Nan::Error("Method foreach has thrown an error.")->ToObject();
        err->Set(Nan::New("errno").ToLocalChecked(), Nan::New(baton->error_code));
        v8::Local<v8::Value> argv[1] = {
          err
        };
        callback->Call(1, argv);
      }
    } else {
      callback->Call(0, NULL);
    }

  }

  delete (Foreach_globalPayload*)baton->payload;

  delete baton;
}


int GitSubmodule::Foreach_callback_cppCallback (
    git_submodule * sm,     const char * name,     void * payload  ) {
  Foreach_CallbackBaton baton(0);

    baton.sm = sm;
    baton.name = name;
    baton.payload = payload;
 
  return baton.ExecuteAsync(Foreach_callback_async);
}

void GitSubmodule::Foreach_callback_async(void *untypedBaton) {
  Nan::HandleScope scope;

  Foreach_CallbackBaton* baton = static_cast<Foreach_CallbackBaton*>(untypedBaton);

    Nan::Callback* callback = ((Foreach_globalPayload*)baton->payload)->callback;
   
  v8::Local<Value> argv[3] = {
          GitSubmodule::New(baton->sm, false),
            Nan::New(baton->name).ToLocalChecked(),
          // payload is null because we can use closure scope in javascript
        Nan::Undefined()
    };

  Nan::TryCatch tryCatch;
  v8::Local<v8::Value> result = callback->Call(3, argv);

  if(PromiseCompletion::ForwardIfPromise(result, baton, Foreach_callback_promiseCompleted)) {
    return;
  }

    if (result.IsEmpty() || result->IsNativeError()) {
      baton->result = -1;
    }
    else if (!result->IsNull() && !result->IsUndefined()) {
       if (result->IsNumber()) {
        baton->result = (int)result->ToNumber()->Value();
      }
      else {
        baton->result = baton->defaultResult;
      }
     }
    else {
      baton->result = baton->defaultResult;
    }
 
  baton->Done();
}

void GitSubmodule::Foreach_callback_promiseCompleted(bool isFulfilled, AsyncBaton *_baton, v8::Local<v8::Value> result) {
  Nan::HandleScope scope;

  Foreach_CallbackBaton* baton = static_cast<Foreach_CallbackBaton*>(_baton);

  if (isFulfilled) {
      if (result.IsEmpty() || result->IsNativeError()) {
        baton->result = -1;
      }
      else if (!result->IsNull() && !result->IsUndefined()) {
         if (result->IsNumber()) {
          baton->result = (int)result->ToNumber()->Value();
        }
        else {
          baton->result = baton->defaultResult;
        }
       }
      else {
        baton->result = baton->defaultResult;
      }
   }
  else {
    // promise was rejected
    GitSubmodule* instance = static_cast<GitSubmodule*>(baton->  payload  );
    v8::Local<v8::Object> parent = instance->handle();
    SetPrivate(parent, Nan::New("NodeGitPromiseError").ToLocalChecked(), result);

    baton->result = -1;
  }
  baton->Done();
}
   
/*
     */
NAN_METHOD(GitSubmodule::Free) {
  Nan::EscapableHandleScope scope;

if (Nan::ObjectWrap::Unwrap<GitSubmodule>(info.This())->GetValue() != NULL) {
 
  giterr_clear();

  {
    LockMaster lockMaster(/*asyncAction: */false        ,    Nan::ObjectWrap::Unwrap<GitSubmodule>(info.This())->GetValue()
);

git_submodule_free(
  Nan::ObjectWrap::Unwrap<GitSubmodule>(info.This())->GetValue()
    );

    Nan::ObjectWrap::Unwrap<GitSubmodule>(info.This())->ClearValue();
  }
     return info.GetReturnValue().Set(scope.Escape(Nan::Undefined()));
  }
}
   
/*
     * @return Oid  result    */
NAN_METHOD(GitSubmodule::HeadId) {
  Nan::EscapableHandleScope scope;

 
  giterr_clear();

  {
    LockMaster lockMaster(/*asyncAction: */false        ,    Nan::ObjectWrap::Unwrap<GitSubmodule>(info.This())->GetValue()
);

    const git_oid * result = git_submodule_head_id(
  Nan::ObjectWrap::Unwrap<GitSubmodule>(info.This())->GetValue()
    );

     // null checks on pointers
    if (!result) {
      return info.GetReturnValue().Set(scope.Escape(Nan::Undefined()));
    }

    v8::Local<v8::Value> to;
// start convert_to_v8 block
  
  if (result != NULL) {
    // GitOid result
       to = GitOid::New(result, true , info.This() );
   }
  else {
    to = Nan::Null();
  }

 // end convert_to_v8 block
    return info.GetReturnValue().Set(scope.Escape(to));
  }
}
   
/*
     * @return Number  result    */
NAN_METHOD(GitSubmodule::Ignore) {
  Nan::EscapableHandleScope scope;

 
  giterr_clear();

  {
    LockMaster lockMaster(/*asyncAction: */false        ,    Nan::ObjectWrap::Unwrap<GitSubmodule>(info.This())->GetValue()
);

    git_submodule_ignore_t result = git_submodule_ignore(
  Nan::ObjectWrap::Unwrap<GitSubmodule>(info.This())->GetValue()
    );

 
    v8::Local<v8::Value> to;
// start convert_to_v8 block
     to = Nan::New<Number>( result);
  // end convert_to_v8 block
    return info.GetReturnValue().Set(scope.Escape(to));
  }
}
   
/*
     * @return Oid  result    */
NAN_METHOD(GitSubmodule::IndexId) {
  Nan::EscapableHandleScope scope;

 
  giterr_clear();

  {
    LockMaster lockMaster(/*asyncAction: */false        ,    Nan::ObjectWrap::Unwrap<GitSubmodule>(info.This())->GetValue()
);

    const git_oid * result = git_submodule_index_id(
  Nan::ObjectWrap::Unwrap<GitSubmodule>(info.This())->GetValue()
    );

     // null checks on pointers
    if (!result) {
      return info.GetReturnValue().Set(scope.Escape(Nan::Undefined()));
    }

    v8::Local<v8::Value> to;
// start convert_to_v8 block
  
  if (result != NULL) {
    // GitOid result
       to = GitOid::New(result, true , info.This() );
   }
  else {
    to = Nan::Null();
  }

 // end convert_to_v8 block
    return info.GetReturnValue().Set(scope.Escape(to));
  }
}
  
/*
   * @param Number overwrite
     */
NAN_METHOD(GitSubmodule::Init) {

  if (info.Length() == 0 || !info[0]->IsNumber()) {
    return Nan::ThrowError("Number overwrite is required.");
  }

  if (info.Length() == 1 || !info[1]->IsFunction()) {
    return Nan::ThrowError("Callback is required and must be a Function.");
  }

  InitBaton* baton = new InitBaton;

  baton->error_code = GIT_OK;
  baton->error = NULL;

  baton->submodule = Nan::ObjectWrap::Unwrap<GitSubmodule>(info.This())->GetValue();
// start convert_from_v8 block
  int from_overwrite;
  from_overwrite = (int)   info[0]->ToNumber()->Value();
// end convert_from_v8 block
  baton->overwrite = from_overwrite;

  Nan::Callback *callback = new Nan::Callback(v8::Local<Function>::Cast(info[1]));
  InitWorker *worker = new InitWorker(baton, callback);
  worker->SaveToPersistent("submodule", info.This());
  if (!info[0]->IsUndefined() && !info[0]->IsNull())
    worker->SaveToPersistent("overwrite", info[0]->ToObject());

  AsyncLibgit2QueueWorker(worker);
  return;
}

void GitSubmodule::InitWorker::Execute() {
  giterr_clear();

  {
    LockMaster lockMaster(/*asyncAction: */true        ,baton->submodule
);

  int result = git_submodule_init(
baton->submodule,baton->overwrite    );

    baton->error_code = result;

    if (result != GIT_OK && giterr_last() != NULL) {
      baton->error = git_error_dup(giterr_last());
    }

  }
}

void GitSubmodule::InitWorker::HandleOKCallback() {
  if (baton->error_code == GIT_OK) {
    v8::Local<v8::Value> result = Nan::Undefined();
    v8::Local<v8::Value> argv[2] = {
      Nan::Null(),
      result
    };
    callback->Call(2, argv);
  } else {
    if (baton->error) {
      v8::Local<v8::Object> err;
      if (baton->error->message) {
        err = Nan::Error(baton->error->message)->ToObject();
      } else {
        err = Nan::Error("Method init has thrown an error.")->ToObject();
      }
      err->Set(Nan::New("errno").ToLocalChecked(), Nan::New(baton->error_code));
      v8::Local<v8::Value> argv[1] = {
        err
      };
      callback->Call(1, argv);
      if (baton->error->message)
        free((void *)baton->error->message);
      free((void *)baton->error);
    } else if (baton->error_code < 0) {
      std::queue< v8::Local<v8::Value> > workerArguments;
      workerArguments.push(GetFromPersistent("overwrite"));
      bool callbackFired = false;
      while(!workerArguments.empty()) {
        v8::Local<v8::Value> node = workerArguments.front();
        workerArguments.pop();

        if (
          !node->IsObject()
          || node->IsArray()
          || node->IsBooleanObject()
          || node->IsDate()
          || node->IsFunction()
          || node->IsNumberObject()
          || node->IsRegExp()
          || node->IsStringObject()
        ) {
          continue;
        }

        v8::Local<v8::Object> nodeObj = node->ToObject();
        v8::Local<v8::Value> checkValue = GetPrivate(nodeObj, Nan::New("NodeGitPromiseError").ToLocalChecked());

        if (!checkValue.IsEmpty() && !checkValue->IsNull() && !checkValue->IsUndefined()) {
          v8::Local<v8::Value> argv[1] = {
            checkValue->ToObject()
          };
          callback->Call(1, argv);
          callbackFired = true;
          break;
        }

        v8::Local<v8::Array> properties = nodeObj->GetPropertyNames();
        for (unsigned int propIndex = 0; propIndex < properties->Length(); ++propIndex) {
          v8::Local<v8::String> propName = properties->Get(propIndex)->ToString();
          v8::Local<v8::Value> nodeToQueue = nodeObj->Get(propName);
          if (!nodeToQueue->IsUndefined()) {
            workerArguments.push(nodeToQueue);
          }
        }
      }

      if (!callbackFired) {
        v8::Local<v8::Object> err = Nan::Error("Method init has thrown an error.")->ToObject();
        err->Set(Nan::New("errno").ToLocalChecked(), Nan::New(baton->error_code));
        v8::Local<v8::Value> argv[1] = {
          err
        };
        callback->Call(1, argv);
      }
    } else {
      callback->Call(0, NULL);
    }

  }


  delete baton;
}

  
/*
     * @param Number callback
   */
NAN_METHOD(GitSubmodule::Location) {

  if (info.Length() == 0 || !info[0]->IsFunction()) {
    return Nan::ThrowError("Callback is required and must be a Function.");
  }

  LocationBaton* baton = new LocationBaton;

  baton->error_code = GIT_OK;
  baton->error = NULL;

      baton->location_status = (unsigned int *)malloc(sizeof(unsigned int ));  
  baton->submodule = Nan::ObjectWrap::Unwrap<GitSubmodule>(info.This())->GetValue();

  Nan::Callback *callback = new Nan::Callback(v8::Local<Function>::Cast(info[0]));
  LocationWorker *worker = new LocationWorker(baton, callback);
  worker->SaveToPersistent("submodule", info.This());

  AsyncLibgit2QueueWorker(worker);
  return;
}

void GitSubmodule::LocationWorker::Execute() {
  giterr_clear();

  {
    LockMaster lockMaster(/*asyncAction: */true        ,baton->location_status
        ,baton->submodule
);

  int result = git_submodule_location(
baton->location_status,baton->submodule    );

    baton->error_code = result;

    if (result != GIT_OK && giterr_last() != NULL) {
      baton->error = git_error_dup(giterr_last());
    }

  }
}

void GitSubmodule::LocationWorker::HandleOKCallback() {
  if (baton->error_code == GIT_OK) {
    v8::Local<v8::Value> to;
// start convert_to_v8 block
     to = Nan::New<Number>(* baton->location_status);
  // end convert_to_v8 block
    v8::Local<v8::Value> result = to;
    v8::Local<v8::Value> argv[2] = {
      Nan::Null(),
      result
    };
    callback->Call(2, argv);
  } else {
    if (baton->error) {
      v8::Local<v8::Object> err;
      if (baton->error->message) {
        err = Nan::Error(baton->error->message)->ToObject();
      } else {
        err = Nan::Error("Method location has thrown an error.")->ToObject();
      }
      err->Set(Nan::New("errno").ToLocalChecked(), Nan::New(baton->error_code));
      v8::Local<v8::Value> argv[1] = {
        err
      };
      callback->Call(1, argv);
      if (baton->error->message)
        free((void *)baton->error->message);
      free((void *)baton->error);
    } else if (baton->error_code < 0) {
      std::queue< v8::Local<v8::Value> > workerArguments;
      bool callbackFired = false;
      while(!workerArguments.empty()) {
        v8::Local<v8::Value> node = workerArguments.front();
        workerArguments.pop();

        if (
          !node->IsObject()
          || node->IsArray()
          || node->IsBooleanObject()
          || node->IsDate()
          || node->IsFunction()
          || node->IsNumberObject()
          || node->IsRegExp()
          || node->IsStringObject()
        ) {
          continue;
        }

        v8::Local<v8::Object> nodeObj = node->ToObject();
        v8::Local<v8::Value> checkValue = GetPrivate(nodeObj, Nan::New("NodeGitPromiseError").ToLocalChecked());

        if (!checkValue.IsEmpty() && !checkValue->IsNull() && !checkValue->IsUndefined()) {
          v8::Local<v8::Value> argv[1] = {
            checkValue->ToObject()
          };
          callback->Call(1, argv);
          callbackFired = true;
          break;
        }

        v8::Local<v8::Array> properties = nodeObj->GetPropertyNames();
        for (unsigned int propIndex = 0; propIndex < properties->Length(); ++propIndex) {
          v8::Local<v8::String> propName = properties->Get(propIndex)->ToString();
          v8::Local<v8::Value> nodeToQueue = nodeObj->Get(propName);
          if (!nodeToQueue->IsUndefined()) {
            workerArguments.push(nodeToQueue);
          }
        }
      }

      if (!callbackFired) {
        v8::Local<v8::Object> err = Nan::Error("Method location has thrown an error.")->ToObject();
        err->Set(Nan::New("errno").ToLocalChecked(), Nan::New(baton->error_code));
        v8::Local<v8::Value> argv[1] = {
          err
        };
        callback->Call(1, argv);
      }
    } else {
      callback->Call(0, NULL);
    }

  }


  delete baton;
}

  
/*
  * @param Repository repo
   * @param String name
    * @param Submodule callback
   */
NAN_METHOD(GitSubmodule::Lookup) {

  if (info.Length() == 0 || !info[0]->IsObject()) {
    return Nan::ThrowError("Repository repo is required.");
  }

  if (info.Length() == 1 || !info[1]->IsString()) {
    return Nan::ThrowError("String name is required.");
  }

  if (info.Length() == 2 || !info[2]->IsFunction()) {
    return Nan::ThrowError("Callback is required and must be a Function.");
  }

  LookupBaton* baton = new LookupBaton;

  baton->error_code = GIT_OK;
  baton->error = NULL;

// start convert_from_v8 block
  git_repository * from_repo = NULL;
from_repo = Nan::ObjectWrap::Unwrap<GitRepository>(info[0]->ToObject())->GetValue();
// end convert_from_v8 block
  baton->repo = from_repo;
// start convert_from_v8 block
  const char * from_name = NULL;

  String::Utf8Value name(info[1]->ToString());
  // malloc with one extra byte so we can add the terminating null character C-strings expect:
  from_name = (const char *) malloc(name.length() + 1);
  // copy the characters from the nodejs string into our C-string (used instead of strdup or strcpy because nulls in
  // the middle of strings are valid coming from nodejs):
  memcpy((void *)from_name, *name, name.length());
  // ensure the final byte of our new string is null, extra casts added to ensure compatibility with various C types
  // used in the nodejs binding generation:
  memset((void *)(((char *)from_name) + name.length()), 0, 1);
// end convert_from_v8 block
  baton->name = from_name;

  Nan::Callback *callback = new Nan::Callback(v8::Local<Function>::Cast(info[2]));
  LookupWorker *worker = new LookupWorker(baton, callback);
  if (!info[0]->IsUndefined() && !info[0]->IsNull())
    worker->SaveToPersistent("repo", info[0]->ToObject());
  if (!info[1]->IsUndefined() && !info[1]->IsNull())
    worker->SaveToPersistent("name", info[1]->ToObject());

  AsyncLibgit2QueueWorker(worker);
  return;
}

void GitSubmodule::LookupWorker::Execute() {
  giterr_clear();

  {
    LockMaster lockMaster(/*asyncAction: */true        ,baton->repo
        ,baton->name
);

  int result = git_submodule_lookup(
&baton->out,baton->repo,baton->name    );

    baton->error_code = result;

    if (result != GIT_OK && giterr_last() != NULL) {
      baton->error = git_error_dup(giterr_last());
    }

  }
}

void GitSubmodule::LookupWorker::HandleOKCallback() {
  if (baton->error_code == GIT_OK) {
    v8::Local<v8::Value> to;
// start convert_to_v8 block
  
  if (baton->out != NULL) {
    // GitSubmodule baton->out
       to = GitSubmodule::New(baton->out, false  );
   }
  else {
    to = Nan::Null();
  }

 // end convert_to_v8 block
    v8::Local<v8::Value> result = to;
    v8::Local<v8::Value> argv[2] = {
      Nan::Null(),
      result
    };
    callback->Call(2, argv);
  } else {
    if (baton->error) {
      v8::Local<v8::Object> err;
      if (baton->error->message) {
        err = Nan::Error(baton->error->message)->ToObject();
      } else {
        err = Nan::Error("Method lookup has thrown an error.")->ToObject();
      }
      err->Set(Nan::New("errno").ToLocalChecked(), Nan::New(baton->error_code));
      v8::Local<v8::Value> argv[1] = {
        err
      };
      callback->Call(1, argv);
      if (baton->error->message)
        free((void *)baton->error->message);
      free((void *)baton->error);
    } else if (baton->error_code < 0) {
      std::queue< v8::Local<v8::Value> > workerArguments;
      workerArguments.push(GetFromPersistent("repo"));
      workerArguments.push(GetFromPersistent("name"));
      bool callbackFired = false;
      while(!workerArguments.empty()) {
        v8::Local<v8::Value> node = workerArguments.front();
        workerArguments.pop();

        if (
          !node->IsObject()
          || node->IsArray()
          || node->IsBooleanObject()
          || node->IsDate()
          || node->IsFunction()
          || node->IsNumberObject()
          || node->IsRegExp()
          || node->IsStringObject()
        ) {
          continue;
        }

        v8::Local<v8::Object> nodeObj = node->ToObject();
        v8::Local<v8::Value> checkValue = GetPrivate(nodeObj, Nan::New("NodeGitPromiseError").ToLocalChecked());

        if (!checkValue.IsEmpty() && !checkValue->IsNull() && !checkValue->IsUndefined()) {
          v8::Local<v8::Value> argv[1] = {
            checkValue->ToObject()
          };
          callback->Call(1, argv);
          callbackFired = true;
          break;
        }

        v8::Local<v8::Array> properties = nodeObj->GetPropertyNames();
        for (unsigned int propIndex = 0; propIndex < properties->Length(); ++propIndex) {
          v8::Local<v8::String> propName = properties->Get(propIndex)->ToString();
          v8::Local<v8::Value> nodeToQueue = nodeObj->Get(propName);
          if (!nodeToQueue->IsUndefined()) {
            workerArguments.push(nodeToQueue);
          }
        }
      }

      if (!callbackFired) {
        v8::Local<v8::Object> err = Nan::Error("Method lookup has thrown an error.")->ToObject();
        err->Set(Nan::New("errno").ToLocalChecked(), Nan::New(baton->error_code));
        v8::Local<v8::Value> argv[1] = {
          err
        };
        callback->Call(1, argv);
      }
    } else {
      callback->Call(0, NULL);
    }

  }


  delete baton;
}

   
/*
     * @return String  result    */
NAN_METHOD(GitSubmodule::Name) {
  Nan::EscapableHandleScope scope;

 
  giterr_clear();

  {
    LockMaster lockMaster(/*asyncAction: */false        ,    Nan::ObjectWrap::Unwrap<GitSubmodule>(info.This())->GetValue()
);

    const char * result = git_submodule_name(
  Nan::ObjectWrap::Unwrap<GitSubmodule>(info.This())->GetValue()
    );

     // null checks on pointers
    if (!result) {
      return info.GetReturnValue().Set(scope.Escape(Nan::Undefined()));
    }

    v8::Local<v8::Value> to;
// start convert_to_v8 block
  if (result){
       to = Nan::New<String>(result).ToLocalChecked();
   }
  else {
    to = Nan::Null();
  }

  // end convert_to_v8 block
    return info.GetReturnValue().Set(scope.Escape(to));
  }
}
  
/*
     * @param Repository callback
   */
NAN_METHOD(GitSubmodule::Open) {

  if (info.Length() == 0 || !info[0]->IsFunction()) {
    return Nan::ThrowError("Callback is required and must be a Function.");
  }

  OpenBaton* baton = new OpenBaton;

  baton->error_code = GIT_OK;
  baton->error = NULL;

  baton->submodule = Nan::ObjectWrap::Unwrap<GitSubmodule>(info.This())->GetValue();

  Nan::Callback *callback = new Nan::Callback(v8::Local<Function>::Cast(info[0]));
  OpenWorker *worker = new OpenWorker(baton, callback);
  worker->SaveToPersistent("submodule", info.This());

  AsyncLibgit2QueueWorker(worker);
  return;
}

void GitSubmodule::OpenWorker::Execute() {
  giterr_clear();

  {
    LockMaster lockMaster(/*asyncAction: */true        ,baton->submodule
);

  int result = git_submodule_open(
&baton->repo,baton->submodule    );

    baton->error_code = result;

    if (result != GIT_OK && giterr_last() != NULL) {
      baton->error = git_error_dup(giterr_last());
    }

  }
}

void GitSubmodule::OpenWorker::HandleOKCallback() {
  if (baton->error_code == GIT_OK) {
    v8::Local<v8::Value> to;
// start convert_to_v8 block
  
  if (baton->repo != NULL) {
    // GitRepository baton->repo
       to = GitRepository::New(baton->repo, false  );
   }
  else {
    to = Nan::Null();
  }

 // end convert_to_v8 block
    v8::Local<v8::Value> result = to;
    v8::Local<v8::Value> argv[2] = {
      Nan::Null(),
      result
    };
    callback->Call(2, argv);
  } else {
    if (baton->error) {
      v8::Local<v8::Object> err;
      if (baton->error->message) {
        err = Nan::Error(baton->error->message)->ToObject();
      } else {
        err = Nan::Error("Method open has thrown an error.")->ToObject();
      }
      err->Set(Nan::New("errno").ToLocalChecked(), Nan::New(baton->error_code));
      v8::Local<v8::Value> argv[1] = {
        err
      };
      callback->Call(1, argv);
      if (baton->error->message)
        free((void *)baton->error->message);
      free((void *)baton->error);
    } else if (baton->error_code < 0) {
      std::queue< v8::Local<v8::Value> > workerArguments;
      bool callbackFired = false;
      while(!workerArguments.empty()) {
        v8::Local<v8::Value> node = workerArguments.front();
        workerArguments.pop();

        if (
          !node->IsObject()
          || node->IsArray()
          || node->IsBooleanObject()
          || node->IsDate()
          || node->IsFunction()
          || node->IsNumberObject()
          || node->IsRegExp()
          || node->IsStringObject()
        ) {
          continue;
        }

        v8::Local<v8::Object> nodeObj = node->ToObject();
        v8::Local<v8::Value> checkValue = GetPrivate(nodeObj, Nan::New("NodeGitPromiseError").ToLocalChecked());

        if (!checkValue.IsEmpty() && !checkValue->IsNull() && !checkValue->IsUndefined()) {
          v8::Local<v8::Value> argv[1] = {
            checkValue->ToObject()
          };
          callback->Call(1, argv);
          callbackFired = true;
          break;
        }

        v8::Local<v8::Array> properties = nodeObj->GetPropertyNames();
        for (unsigned int propIndex = 0; propIndex < properties->Length(); ++propIndex) {
          v8::Local<v8::String> propName = properties->Get(propIndex)->ToString();
          v8::Local<v8::Value> nodeToQueue = nodeObj->Get(propName);
          if (!nodeToQueue->IsUndefined()) {
            workerArguments.push(nodeToQueue);
          }
        }
      }

      if (!callbackFired) {
        v8::Local<v8::Object> err = Nan::Error("Method open has thrown an error.")->ToObject();
        err->Set(Nan::New("errno").ToLocalChecked(), Nan::New(baton->error_code));
        v8::Local<v8::Value> argv[1] = {
          err
        };
        callback->Call(1, argv);
      }
    } else {
      callback->Call(0, NULL);
    }

  }


  delete baton;
}

   
/*
     * @return Repository  result    */
NAN_METHOD(GitSubmodule::Owner) {
  Nan::EscapableHandleScope scope;

 
  giterr_clear();

  {
    LockMaster lockMaster(/*asyncAction: */false        ,    Nan::ObjectWrap::Unwrap<GitSubmodule>(info.This())->GetValue()
);

    git_repository * result = git_submodule_owner(
  Nan::ObjectWrap::Unwrap<GitSubmodule>(info.This())->GetValue()
    );

     // null checks on pointers
    if (!result) {
      return info.GetReturnValue().Set(scope.Escape(Nan::Undefined()));
    }

    v8::Local<v8::Value> to;
// start convert_to_v8 block
  
  if (result != NULL) {
    // GitRepository result
       to = GitRepository::New(result, false  );
   }
  else {
    to = Nan::Null();
  }

 // end convert_to_v8 block
    return info.GetReturnValue().Set(scope.Escape(to));
  }
}
   
/*
     * @return String  result    */
NAN_METHOD(GitSubmodule::Path) {
  Nan::EscapableHandleScope scope;

 
  giterr_clear();

  {
    LockMaster lockMaster(/*asyncAction: */false        ,    Nan::ObjectWrap::Unwrap<GitSubmodule>(info.This())->GetValue()
);

    const char * result = git_submodule_path(
  Nan::ObjectWrap::Unwrap<GitSubmodule>(info.This())->GetValue()
    );

     // null checks on pointers
    if (!result) {
      return info.GetReturnValue().Set(scope.Escape(Nan::Undefined()));
    }

    v8::Local<v8::Value> to;
// start convert_to_v8 block
  if (result){
       to = Nan::New<String>(result).ToLocalChecked();
   }
  else {
    to = Nan::Null();
  }

  // end convert_to_v8 block
    return info.GetReturnValue().Set(scope.Escape(to));
  }
}
   
/*
   * @param Number force
     * @return Number  result    */
NAN_METHOD(GitSubmodule::Reload) {
  Nan::EscapableHandleScope scope;

  if (info.Length() == 0 || !info[0]->IsNumber()) {
    return Nan::ThrowError("Number force is required.");
  }

// start convert_from_v8 block
  int from_force;
  from_force = (int)   info[0]->ToNumber()->Value();
// end convert_from_v8 block
 
  giterr_clear();

  {
    LockMaster lockMaster(/*asyncAction: */false        ,    Nan::ObjectWrap::Unwrap<GitSubmodule>(info.This())->GetValue()
);

    int result = git_submodule_reload(
  Nan::ObjectWrap::Unwrap<GitSubmodule>(info.This())->GetValue()
,  from_force
    );

 
    v8::Local<v8::Value> to;
// start convert_to_v8 block
     to = Nan::New<Number>( result);
  // end convert_to_v8 block
    return info.GetReturnValue().Set(scope.Escape(to));
  }
}
  
/*
    * @param Number use_gitlink
    * @param Repository callback
   */
NAN_METHOD(GitSubmodule::RepoInit) {

  if (info.Length() == 0 || !info[0]->IsNumber()) {
    return Nan::ThrowError("Number use_gitlink is required.");
  }

  if (info.Length() == 1 || !info[1]->IsFunction()) {
    return Nan::ThrowError("Callback is required and must be a Function.");
  }

  RepoInitBaton* baton = new RepoInitBaton;

  baton->error_code = GIT_OK;
  baton->error = NULL;

  baton->sm = Nan::ObjectWrap::Unwrap<GitSubmodule>(info.This())->GetValue();
// start convert_from_v8 block
  int from_use_gitlink;
  from_use_gitlink = (int)   info[0]->ToNumber()->Value();
// end convert_from_v8 block
  baton->use_gitlink = from_use_gitlink;

  Nan::Callback *callback = new Nan::Callback(v8::Local<Function>::Cast(info[1]));
  RepoInitWorker *worker = new RepoInitWorker(baton, callback);
  worker->SaveToPersistent("sm", info.This());
  if (!info[0]->IsUndefined() && !info[0]->IsNull())
    worker->SaveToPersistent("use_gitlink", info[0]->ToObject());

  AsyncLibgit2QueueWorker(worker);
  return;
}

void GitSubmodule::RepoInitWorker::Execute() {
  giterr_clear();

  {
    LockMaster lockMaster(/*asyncAction: */true        ,baton->sm
);

  int result = git_submodule_repo_init(
&baton->out,baton->sm,baton->use_gitlink    );

    baton->error_code = result;

    if (result != GIT_OK && giterr_last() != NULL) {
      baton->error = git_error_dup(giterr_last());
    }

  }
}

void GitSubmodule::RepoInitWorker::HandleOKCallback() {
  if (baton->error_code == GIT_OK) {
    v8::Local<v8::Value> to;
// start convert_to_v8 block
  
  if (baton->out != NULL) {
    // GitRepository baton->out
       to = GitRepository::New(baton->out, false  );
   }
  else {
    to = Nan::Null();
  }

 // end convert_to_v8 block
    v8::Local<v8::Value> result = to;
    v8::Local<v8::Value> argv[2] = {
      Nan::Null(),
      result
    };
    callback->Call(2, argv);
  } else {
    if (baton->error) {
      v8::Local<v8::Object> err;
      if (baton->error->message) {
        err = Nan::Error(baton->error->message)->ToObject();
      } else {
        err = Nan::Error("Method repoInit has thrown an error.")->ToObject();
      }
      err->Set(Nan::New("errno").ToLocalChecked(), Nan::New(baton->error_code));
      v8::Local<v8::Value> argv[1] = {
        err
      };
      callback->Call(1, argv);
      if (baton->error->message)
        free((void *)baton->error->message);
      free((void *)baton->error);
    } else if (baton->error_code < 0) {
      std::queue< v8::Local<v8::Value> > workerArguments;
      workerArguments.push(GetFromPersistent("use_gitlink"));
      bool callbackFired = false;
      while(!workerArguments.empty()) {
        v8::Local<v8::Value> node = workerArguments.front();
        workerArguments.pop();

        if (
          !node->IsObject()
          || node->IsArray()
          || node->IsBooleanObject()
          || node->IsDate()
          || node->IsFunction()
          || node->IsNumberObject()
          || node->IsRegExp()
          || node->IsStringObject()
        ) {
          continue;
        }

        v8::Local<v8::Object> nodeObj = node->ToObject();
        v8::Local<v8::Value> checkValue = GetPrivate(nodeObj, Nan::New("NodeGitPromiseError").ToLocalChecked());

        if (!checkValue.IsEmpty() && !checkValue->IsNull() && !checkValue->IsUndefined()) {
          v8::Local<v8::Value> argv[1] = {
            checkValue->ToObject()
          };
          callback->Call(1, argv);
          callbackFired = true;
          break;
        }

        v8::Local<v8::Array> properties = nodeObj->GetPropertyNames();
        for (unsigned int propIndex = 0; propIndex < properties->Length(); ++propIndex) {
          v8::Local<v8::String> propName = properties->Get(propIndex)->ToString();
          v8::Local<v8::Value> nodeToQueue = nodeObj->Get(propName);
          if (!nodeToQueue->IsUndefined()) {
            workerArguments.push(nodeToQueue);
          }
        }
      }

      if (!callbackFired) {
        v8::Local<v8::Object> err = Nan::Error("Method repoInit has thrown an error.")->ToObject();
        err->Set(Nan::New("errno").ToLocalChecked(), Nan::New(baton->error_code));
        v8::Local<v8::Value> argv[1] = {
          err
        };
        callback->Call(1, argv);
      }
    } else {
      callback->Call(0, NULL);
    }

  }


  delete baton;
}

  
/*
  * @param Repository repo
   * @param String url
    * @param Buf callback
   */
NAN_METHOD(GitSubmodule::ResolveUrl) {

  if (info.Length() == 0 || !info[0]->IsObject()) {
    return Nan::ThrowError("Repository repo is required.");
  }

  if (info.Length() == 1 || !info[1]->IsString()) {
    return Nan::ThrowError("String url is required.");
  }

  if (info.Length() == 2 || !info[2]->IsFunction()) {
    return Nan::ThrowError("Callback is required and must be a Function.");
  }

  ResolveUrlBaton* baton = new ResolveUrlBaton;

  baton->error_code = GIT_OK;
  baton->error = NULL;

      baton->out = (git_buf *)malloc(sizeof(git_buf ));  
        baton->out->ptr = NULL;
        baton->out->size = baton->out->asize = 0;
// start convert_from_v8 block
  git_repository * from_repo = NULL;
from_repo = Nan::ObjectWrap::Unwrap<GitRepository>(info[0]->ToObject())->GetValue();
// end convert_from_v8 block
  baton->repo = from_repo;
// start convert_from_v8 block
  const char * from_url = NULL;

  String::Utf8Value url(info[1]->ToString());
  // malloc with one extra byte so we can add the terminating null character C-strings expect:
  from_url = (const char *) malloc(url.length() + 1);
  // copy the characters from the nodejs string into our C-string (used instead of strdup or strcpy because nulls in
  // the middle of strings are valid coming from nodejs):
  memcpy((void *)from_url, *url, url.length());
  // ensure the final byte of our new string is null, extra casts added to ensure compatibility with various C types
  // used in the nodejs binding generation:
  memset((void *)(((char *)from_url) + url.length()), 0, 1);
// end convert_from_v8 block
  baton->url = from_url;

  Nan::Callback *callback = new Nan::Callback(v8::Local<Function>::Cast(info[2]));
  ResolveUrlWorker *worker = new ResolveUrlWorker(baton, callback);
  if (!info[0]->IsUndefined() && !info[0]->IsNull())
    worker->SaveToPersistent("repo", info[0]->ToObject());
  if (!info[1]->IsUndefined() && !info[1]->IsNull())
    worker->SaveToPersistent("url", info[1]->ToObject());

  AsyncLibgit2QueueWorker(worker);
  return;
}

void GitSubmodule::ResolveUrlWorker::Execute() {
  giterr_clear();

  {
    LockMaster lockMaster(/*asyncAction: */true        ,baton->out
        ,baton->repo
        ,baton->url
);

  int result = git_submodule_resolve_url(
baton->out,baton->repo,baton->url    );

    baton->error_code = result;

    if (result != GIT_OK && giterr_last() != NULL) {
      baton->error = git_error_dup(giterr_last());
    }

  }
}

void GitSubmodule::ResolveUrlWorker::HandleOKCallback() {
  if (baton->error_code == GIT_OK) {
    v8::Local<v8::Value> to;
// start convert_to_v8 block
   if (baton->out) {
    to = Nan::New<String>(baton->out->ptr, baton->out->size).ToLocalChecked();
  }
  else {
    to = Nan::Null();
  }
  // end convert_to_v8 block
    v8::Local<v8::Value> result = to;
    v8::Local<v8::Value> argv[2] = {
      Nan::Null(),
      result
    };
    callback->Call(2, argv);
  } else {
    if (baton->error) {
      v8::Local<v8::Object> err;
      if (baton->error->message) {
        err = Nan::Error(baton->error->message)->ToObject();
      } else {
        err = Nan::Error("Method resolveUrl has thrown an error.")->ToObject();
      }
      err->Set(Nan::New("errno").ToLocalChecked(), Nan::New(baton->error_code));
      v8::Local<v8::Value> argv[1] = {
        err
      };
      callback->Call(1, argv);
      if (baton->error->message)
        free((void *)baton->error->message);
      free((void *)baton->error);
    } else if (baton->error_code < 0) {
      std::queue< v8::Local<v8::Value> > workerArguments;
      workerArguments.push(GetFromPersistent("repo"));
      workerArguments.push(GetFromPersistent("url"));
      bool callbackFired = false;
      while(!workerArguments.empty()) {
        v8::Local<v8::Value> node = workerArguments.front();
        workerArguments.pop();

        if (
          !node->IsObject()
          || node->IsArray()
          || node->IsBooleanObject()
          || node->IsDate()
          || node->IsFunction()
          || node->IsNumberObject()
          || node->IsRegExp()
          || node->IsStringObject()
        ) {
          continue;
        }

        v8::Local<v8::Object> nodeObj = node->ToObject();
        v8::Local<v8::Value> checkValue = GetPrivate(nodeObj, Nan::New("NodeGitPromiseError").ToLocalChecked());

        if (!checkValue.IsEmpty() && !checkValue->IsNull() && !checkValue->IsUndefined()) {
          v8::Local<v8::Value> argv[1] = {
            checkValue->ToObject()
          };
          callback->Call(1, argv);
          callbackFired = true;
          break;
        }

        v8::Local<v8::Array> properties = nodeObj->GetPropertyNames();
        for (unsigned int propIndex = 0; propIndex < properties->Length(); ++propIndex) {
          v8::Local<v8::String> propName = properties->Get(propIndex)->ToString();
          v8::Local<v8::Value> nodeToQueue = nodeObj->Get(propName);
          if (!nodeToQueue->IsUndefined()) {
            workerArguments.push(nodeToQueue);
          }
        }
      }

      if (!callbackFired) {
        v8::Local<v8::Object> err = Nan::Error("Method resolveUrl has thrown an error.")->ToObject();
        err->Set(Nan::New("errno").ToLocalChecked(), Nan::New(baton->error_code));
        v8::Local<v8::Value> argv[1] = {
          err
        };
        callback->Call(1, argv);
      }
    } else {
      callback->Call(0, NULL);
    }

  }

        git_buf_free(baton->out);
        free((void *)baton->out);

  delete baton;
}

   
/*
 * @param Repository repo
   * @param String name
   * @param String branch
     * @return Number  result    */
NAN_METHOD(GitSubmodule::SetBranch) {
  Nan::EscapableHandleScope scope;

  if (info.Length() == 0 || !info[0]->IsObject()) {
    return Nan::ThrowError("Repository repo is required.");
  }

  if (info.Length() == 1 || !info[1]->IsString()) {
    return Nan::ThrowError("String name is required.");
  }

  if (info.Length() == 2 || !info[2]->IsString()) {
    return Nan::ThrowError("String branch is required.");
  }

// start convert_from_v8 block
  git_repository * from_repo = NULL;
from_repo = Nan::ObjectWrap::Unwrap<GitRepository>(info[0]->ToObject())->GetValue();
// end convert_from_v8 block
// start convert_from_v8 block
  const char * from_name = NULL;

  String::Utf8Value name(info[1]->ToString());
  // malloc with one extra byte so we can add the terminating null character C-strings expect:
  from_name = (const char *) malloc(name.length() + 1);
  // copy the characters from the nodejs string into our C-string (used instead of strdup or strcpy because nulls in
  // the middle of strings are valid coming from nodejs):
  memcpy((void *)from_name, *name, name.length());
  // ensure the final byte of our new string is null, extra casts added to ensure compatibility with various C types
  // used in the nodejs binding generation:
  memset((void *)(((char *)from_name) + name.length()), 0, 1);
// end convert_from_v8 block
// start convert_from_v8 block
  const char * from_branch = NULL;

  String::Utf8Value branch(info[2]->ToString());
  // malloc with one extra byte so we can add the terminating null character C-strings expect:
  from_branch = (const char *) malloc(branch.length() + 1);
  // copy the characters from the nodejs string into our C-string (used instead of strdup or strcpy because nulls in
  // the middle of strings are valid coming from nodejs):
  memcpy((void *)from_branch, *branch, branch.length());
  // ensure the final byte of our new string is null, extra casts added to ensure compatibility with various C types
  // used in the nodejs binding generation:
  memset((void *)(((char *)from_branch) + branch.length()), 0, 1);
// end convert_from_v8 block
 
  giterr_clear();

  {
    LockMaster lockMaster(/*asyncAction: */false        ,    from_repo
        ,    from_name
        ,    from_branch
);

    int result = git_submodule_set_branch(
  from_repo
,  from_name
,  from_branch
    );

 
    v8::Local<v8::Value> to;
// start convert_to_v8 block
     to = Nan::New<Number>( result);
  // end convert_to_v8 block
    return info.GetReturnValue().Set(scope.Escape(to));
  }
}
   
/*
 * @param Repository repo
   * @param String name
   * @param Number fetch_recurse_submodules
     * @return Number  result    */
NAN_METHOD(GitSubmodule::SetFetchRecurseSubmodules) {
  Nan::EscapableHandleScope scope;

  if (info.Length() == 0 || !info[0]->IsObject()) {
    return Nan::ThrowError("Repository repo is required.");
  }

  if (info.Length() == 1 || !info[1]->IsString()) {
    return Nan::ThrowError("String name is required.");
  }

  if (info.Length() == 2 || !info[2]->IsNumber()) {
    return Nan::ThrowError("Number fetch_recurse_submodules is required.");
  }

// start convert_from_v8 block
  git_repository * from_repo = NULL;
from_repo = Nan::ObjectWrap::Unwrap<GitRepository>(info[0]->ToObject())->GetValue();
// end convert_from_v8 block
// start convert_from_v8 block
  const char * from_name = NULL;

  String::Utf8Value name(info[1]->ToString());
  // malloc with one extra byte so we can add the terminating null character C-strings expect:
  from_name = (const char *) malloc(name.length() + 1);
  // copy the characters from the nodejs string into our C-string (used instead of strdup or strcpy because nulls in
  // the middle of strings are valid coming from nodejs):
  memcpy((void *)from_name, *name, name.length());
  // ensure the final byte of our new string is null, extra casts added to ensure compatibility with various C types
  // used in the nodejs binding generation:
  memset((void *)(((char *)from_name) + name.length()), 0, 1);
// end convert_from_v8 block
// start convert_from_v8 block
  git_submodule_recurse_t from_fetch_recurse_submodules;
  from_fetch_recurse_submodules = (git_submodule_recurse_t)  (int) info[2]->ToNumber()->Value();
// end convert_from_v8 block
 
  giterr_clear();

  {
    LockMaster lockMaster(/*asyncAction: */false        ,    from_repo
        ,    from_name
);

    int result = git_submodule_set_fetch_recurse_submodules(
  from_repo
,  from_name
,  from_fetch_recurse_submodules
    );

 
    v8::Local<v8::Value> to;
// start convert_to_v8 block
     to = Nan::New<Number>( result);
  // end convert_to_v8 block
    return info.GetReturnValue().Set(scope.Escape(to));
  }
}
  
/*
 * @param Repository repo
   * @param String name
   * @param Number ignore
     */
NAN_METHOD(GitSubmodule::SetIgnore) {

  if (info.Length() == 0 || !info[0]->IsObject()) {
    return Nan::ThrowError("Repository repo is required.");
  }

  if (info.Length() == 1 || !info[1]->IsString()) {
    return Nan::ThrowError("String name is required.");
  }

  if (info.Length() == 2 || !info[2]->IsNumber()) {
    return Nan::ThrowError("Number ignore is required.");
  }

  if (info.Length() == 3 || !info[3]->IsFunction()) {
    return Nan::ThrowError("Callback is required and must be a Function.");
  }

  SetIgnoreBaton* baton = new SetIgnoreBaton;

  baton->error_code = GIT_OK;
  baton->error = NULL;

// start convert_from_v8 block
  git_repository * from_repo = NULL;
from_repo = Nan::ObjectWrap::Unwrap<GitRepository>(info[0]->ToObject())->GetValue();
// end convert_from_v8 block
  baton->repo = from_repo;
// start convert_from_v8 block
  const char * from_name = NULL;

  String::Utf8Value name(info[1]->ToString());
  // malloc with one extra byte so we can add the terminating null character C-strings expect:
  from_name = (const char *) malloc(name.length() + 1);
  // copy the characters from the nodejs string into our C-string (used instead of strdup or strcpy because nulls in
  // the middle of strings are valid coming from nodejs):
  memcpy((void *)from_name, *name, name.length());
  // ensure the final byte of our new string is null, extra casts added to ensure compatibility with various C types
  // used in the nodejs binding generation:
  memset((void *)(((char *)from_name) + name.length()), 0, 1);
// end convert_from_v8 block
  baton->name = from_name;
// start convert_from_v8 block
  git_submodule_ignore_t from_ignore;
  from_ignore = (git_submodule_ignore_t)  (int) info[2]->ToNumber()->Value();
// end convert_from_v8 block
  baton->ignore = from_ignore;

  Nan::Callback *callback = new Nan::Callback(v8::Local<Function>::Cast(info[3]));
  SetIgnoreWorker *worker = new SetIgnoreWorker(baton, callback);
  if (!info[0]->IsUndefined() && !info[0]->IsNull())
    worker->SaveToPersistent("repo", info[0]->ToObject());
  if (!info[1]->IsUndefined() && !info[1]->IsNull())
    worker->SaveToPersistent("name", info[1]->ToObject());
  if (!info[2]->IsUndefined() && !info[2]->IsNull())
    worker->SaveToPersistent("ignore", info[2]->ToObject());

  AsyncLibgit2QueueWorker(worker);
  return;
}

void GitSubmodule::SetIgnoreWorker::Execute() {
  giterr_clear();

  {
    LockMaster lockMaster(/*asyncAction: */true        ,baton->repo
        ,baton->name
);

  int result = git_submodule_set_ignore(
baton->repo,baton->name,baton->ignore    );

    baton->error_code = result;

    if (result != GIT_OK && giterr_last() != NULL) {
      baton->error = git_error_dup(giterr_last());
    }

  }
}

void GitSubmodule::SetIgnoreWorker::HandleOKCallback() {
  if (baton->error_code == GIT_OK) {
    v8::Local<v8::Value> result = Nan::Undefined();
    v8::Local<v8::Value> argv[2] = {
      Nan::Null(),
      result
    };
    callback->Call(2, argv);
  } else {
    if (baton->error) {
      v8::Local<v8::Object> err;
      if (baton->error->message) {
        err = Nan::Error(baton->error->message)->ToObject();
      } else {
        err = Nan::Error("Method setIgnore has thrown an error.")->ToObject();
      }
      err->Set(Nan::New("errno").ToLocalChecked(), Nan::New(baton->error_code));
      v8::Local<v8::Value> argv[1] = {
        err
      };
      callback->Call(1, argv);
      if (baton->error->message)
        free((void *)baton->error->message);
      free((void *)baton->error);
    } else if (baton->error_code < 0) {
      std::queue< v8::Local<v8::Value> > workerArguments;
      workerArguments.push(GetFromPersistent("repo"));
      workerArguments.push(GetFromPersistent("name"));
      workerArguments.push(GetFromPersistent("ignore"));
      bool callbackFired = false;
      while(!workerArguments.empty()) {
        v8::Local<v8::Value> node = workerArguments.front();
        workerArguments.pop();

        if (
          !node->IsObject()
          || node->IsArray()
          || node->IsBooleanObject()
          || node->IsDate()
          || node->IsFunction()
          || node->IsNumberObject()
          || node->IsRegExp()
          || node->IsStringObject()
        ) {
          continue;
        }

        v8::Local<v8::Object> nodeObj = node->ToObject();
        v8::Local<v8::Value> checkValue = GetPrivate(nodeObj, Nan::New("NodeGitPromiseError").ToLocalChecked());

        if (!checkValue.IsEmpty() && !checkValue->IsNull() && !checkValue->IsUndefined()) {
          v8::Local<v8::Value> argv[1] = {
            checkValue->ToObject()
          };
          callback->Call(1, argv);
          callbackFired = true;
          break;
        }

        v8::Local<v8::Array> properties = nodeObj->GetPropertyNames();
        for (unsigned int propIndex = 0; propIndex < properties->Length(); ++propIndex) {
          v8::Local<v8::String> propName = properties->Get(propIndex)->ToString();
          v8::Local<v8::Value> nodeToQueue = nodeObj->Get(propName);
          if (!nodeToQueue->IsUndefined()) {
            workerArguments.push(nodeToQueue);
          }
        }
      }

      if (!callbackFired) {
        v8::Local<v8::Object> err = Nan::Error("Method setIgnore has thrown an error.")->ToObject();
        err->Set(Nan::New("errno").ToLocalChecked(), Nan::New(baton->error_code));
        v8::Local<v8::Value> argv[1] = {
          err
        };
        callback->Call(1, argv);
      }
    } else {
      callback->Call(0, NULL);
    }

  }


  delete baton;
}

  
/*
 * @param Repository repo
   * @param String name
   * @param Number update
     */
NAN_METHOD(GitSubmodule::SetUpdate) {

  if (info.Length() == 0 || !info[0]->IsObject()) {
    return Nan::ThrowError("Repository repo is required.");
  }

  if (info.Length() == 1 || !info[1]->IsString()) {
    return Nan::ThrowError("String name is required.");
  }

  if (info.Length() == 2 || !info[2]->IsNumber()) {
    return Nan::ThrowError("Number update is required.");
  }

  if (info.Length() == 3 || !info[3]->IsFunction()) {
    return Nan::ThrowError("Callback is required and must be a Function.");
  }

  SetUpdateBaton* baton = new SetUpdateBaton;

  baton->error_code = GIT_OK;
  baton->error = NULL;

// start convert_from_v8 block
  git_repository * from_repo = NULL;
from_repo = Nan::ObjectWrap::Unwrap<GitRepository>(info[0]->ToObject())->GetValue();
// end convert_from_v8 block
  baton->repo = from_repo;
// start convert_from_v8 block
  const char * from_name = NULL;

  String::Utf8Value name(info[1]->ToString());
  // malloc with one extra byte so we can add the terminating null character C-strings expect:
  from_name = (const char *) malloc(name.length() + 1);
  // copy the characters from the nodejs string into our C-string (used instead of strdup or strcpy because nulls in
  // the middle of strings are valid coming from nodejs):
  memcpy((void *)from_name, *name, name.length());
  // ensure the final byte of our new string is null, extra casts added to ensure compatibility with various C types
  // used in the nodejs binding generation:
  memset((void *)(((char *)from_name) + name.length()), 0, 1);
// end convert_from_v8 block
  baton->name = from_name;
// start convert_from_v8 block
  git_submodule_update_t from_update;
  from_update = (git_submodule_update_t)  (int) info[2]->ToNumber()->Value();
// end convert_from_v8 block
  baton->update = from_update;

  Nan::Callback *callback = new Nan::Callback(v8::Local<Function>::Cast(info[3]));
  SetUpdateWorker *worker = new SetUpdateWorker(baton, callback);
  if (!info[0]->IsUndefined() && !info[0]->IsNull())
    worker->SaveToPersistent("repo", info[0]->ToObject());
  if (!info[1]->IsUndefined() && !info[1]->IsNull())
    worker->SaveToPersistent("name", info[1]->ToObject());
  if (!info[2]->IsUndefined() && !info[2]->IsNull())
    worker->SaveToPersistent("update", info[2]->ToObject());

  AsyncLibgit2QueueWorker(worker);
  return;
}

void GitSubmodule::SetUpdateWorker::Execute() {
  giterr_clear();

  {
    LockMaster lockMaster(/*asyncAction: */true        ,baton->repo
        ,baton->name
);

  int result = git_submodule_set_update(
baton->repo,baton->name,baton->update    );

    baton->error_code = result;

    if (result != GIT_OK && giterr_last() != NULL) {
      baton->error = git_error_dup(giterr_last());
    }

  }
}

void GitSubmodule::SetUpdateWorker::HandleOKCallback() {
  if (baton->error_code == GIT_OK) {
    v8::Local<v8::Value> result = Nan::Undefined();
    v8::Local<v8::Value> argv[2] = {
      Nan::Null(),
      result
    };
    callback->Call(2, argv);
  } else {
    if (baton->error) {
      v8::Local<v8::Object> err;
      if (baton->error->message) {
        err = Nan::Error(baton->error->message)->ToObject();
      } else {
        err = Nan::Error("Method setUpdate has thrown an error.")->ToObject();
      }
      err->Set(Nan::New("errno").ToLocalChecked(), Nan::New(baton->error_code));
      v8::Local<v8::Value> argv[1] = {
        err
      };
      callback->Call(1, argv);
      if (baton->error->message)
        free((void *)baton->error->message);
      free((void *)baton->error);
    } else if (baton->error_code < 0) {
      std::queue< v8::Local<v8::Value> > workerArguments;
      workerArguments.push(GetFromPersistent("repo"));
      workerArguments.push(GetFromPersistent("name"));
      workerArguments.push(GetFromPersistent("update"));
      bool callbackFired = false;
      while(!workerArguments.empty()) {
        v8::Local<v8::Value> node = workerArguments.front();
        workerArguments.pop();

        if (
          !node->IsObject()
          || node->IsArray()
          || node->IsBooleanObject()
          || node->IsDate()
          || node->IsFunction()
          || node->IsNumberObject()
          || node->IsRegExp()
          || node->IsStringObject()
        ) {
          continue;
        }

        v8::Local<v8::Object> nodeObj = node->ToObject();
        v8::Local<v8::Value> checkValue = GetPrivate(nodeObj, Nan::New("NodeGitPromiseError").ToLocalChecked());

        if (!checkValue.IsEmpty() && !checkValue->IsNull() && !checkValue->IsUndefined()) {
          v8::Local<v8::Value> argv[1] = {
            checkValue->ToObject()
          };
          callback->Call(1, argv);
          callbackFired = true;
          break;
        }

        v8::Local<v8::Array> properties = nodeObj->GetPropertyNames();
        for (unsigned int propIndex = 0; propIndex < properties->Length(); ++propIndex) {
          v8::Local<v8::String> propName = properties->Get(propIndex)->ToString();
          v8::Local<v8::Value> nodeToQueue = nodeObj->Get(propName);
          if (!nodeToQueue->IsUndefined()) {
            workerArguments.push(nodeToQueue);
          }
        }
      }

      if (!callbackFired) {
        v8::Local<v8::Object> err = Nan::Error("Method setUpdate has thrown an error.")->ToObject();
        err->Set(Nan::New("errno").ToLocalChecked(), Nan::New(baton->error_code));
        v8::Local<v8::Value> argv[1] = {
          err
        };
        callback->Call(1, argv);
      }
    } else {
      callback->Call(0, NULL);
    }

  }


  delete baton;
}

  
/*
 * @param Repository repo
   * @param String name
   * @param String url
     */
NAN_METHOD(GitSubmodule::SetUrl) {

  if (info.Length() == 0 || !info[0]->IsObject()) {
    return Nan::ThrowError("Repository repo is required.");
  }

  if (info.Length() == 1 || !info[1]->IsString()) {
    return Nan::ThrowError("String name is required.");
  }

  if (info.Length() == 2 || !info[2]->IsString()) {
    return Nan::ThrowError("String url is required.");
  }

  if (info.Length() == 3 || !info[3]->IsFunction()) {
    return Nan::ThrowError("Callback is required and must be a Function.");
  }

  SetUrlBaton* baton = new SetUrlBaton;

  baton->error_code = GIT_OK;
  baton->error = NULL;

// start convert_from_v8 block
  git_repository * from_repo = NULL;
from_repo = Nan::ObjectWrap::Unwrap<GitRepository>(info[0]->ToObject())->GetValue();
// end convert_from_v8 block
  baton->repo = from_repo;
// start convert_from_v8 block
  const char * from_name = NULL;

  String::Utf8Value name(info[1]->ToString());
  // malloc with one extra byte so we can add the terminating null character C-strings expect:
  from_name = (const char *) malloc(name.length() + 1);
  // copy the characters from the nodejs string into our C-string (used instead of strdup or strcpy because nulls in
  // the middle of strings are valid coming from nodejs):
  memcpy((void *)from_name, *name, name.length());
  // ensure the final byte of our new string is null, extra casts added to ensure compatibility with various C types
  // used in the nodejs binding generation:
  memset((void *)(((char *)from_name) + name.length()), 0, 1);
// end convert_from_v8 block
  baton->name = from_name;
// start convert_from_v8 block
  const char * from_url = NULL;

  String::Utf8Value url(info[2]->ToString());
  // malloc with one extra byte so we can add the terminating null character C-strings expect:
  from_url = (const char *) malloc(url.length() + 1);
  // copy the characters from the nodejs string into our C-string (used instead of strdup or strcpy because nulls in
  // the middle of strings are valid coming from nodejs):
  memcpy((void *)from_url, *url, url.length());
  // ensure the final byte of our new string is null, extra casts added to ensure compatibility with various C types
  // used in the nodejs binding generation:
  memset((void *)(((char *)from_url) + url.length()), 0, 1);
// end convert_from_v8 block
  baton->url = from_url;

  Nan::Callback *callback = new Nan::Callback(v8::Local<Function>::Cast(info[3]));
  SetUrlWorker *worker = new SetUrlWorker(baton, callback);
  if (!info[0]->IsUndefined() && !info[0]->IsNull())
    worker->SaveToPersistent("repo", info[0]->ToObject());
  if (!info[1]->IsUndefined() && !info[1]->IsNull())
    worker->SaveToPersistent("name", info[1]->ToObject());
  if (!info[2]->IsUndefined() && !info[2]->IsNull())
    worker->SaveToPersistent("url", info[2]->ToObject());

  AsyncLibgit2QueueWorker(worker);
  return;
}

void GitSubmodule::SetUrlWorker::Execute() {
  giterr_clear();

  {
    LockMaster lockMaster(/*asyncAction: */true        ,baton->repo
        ,baton->name
        ,baton->url
);

  int result = git_submodule_set_url(
baton->repo,baton->name,baton->url    );

    baton->error_code = result;

    if (result != GIT_OK && giterr_last() != NULL) {
      baton->error = git_error_dup(giterr_last());
    }

  }
}

void GitSubmodule::SetUrlWorker::HandleOKCallback() {
  if (baton->error_code == GIT_OK) {
    v8::Local<v8::Value> result = Nan::Undefined();
    v8::Local<v8::Value> argv[2] = {
      Nan::Null(),
      result
    };
    callback->Call(2, argv);
  } else {
    if (baton->error) {
      v8::Local<v8::Object> err;
      if (baton->error->message) {
        err = Nan::Error(baton->error->message)->ToObject();
      } else {
        err = Nan::Error("Method setUrl has thrown an error.")->ToObject();
      }
      err->Set(Nan::New("errno").ToLocalChecked(), Nan::New(baton->error_code));
      v8::Local<v8::Value> argv[1] = {
        err
      };
      callback->Call(1, argv);
      if (baton->error->message)
        free((void *)baton->error->message);
      free((void *)baton->error);
    } else if (baton->error_code < 0) {
      std::queue< v8::Local<v8::Value> > workerArguments;
      workerArguments.push(GetFromPersistent("repo"));
      workerArguments.push(GetFromPersistent("name"));
      workerArguments.push(GetFromPersistent("url"));
      bool callbackFired = false;
      while(!workerArguments.empty()) {
        v8::Local<v8::Value> node = workerArguments.front();
        workerArguments.pop();

        if (
          !node->IsObject()
          || node->IsArray()
          || node->IsBooleanObject()
          || node->IsDate()
          || node->IsFunction()
          || node->IsNumberObject()
          || node->IsRegExp()
          || node->IsStringObject()
        ) {
          continue;
        }

        v8::Local<v8::Object> nodeObj = node->ToObject();
        v8::Local<v8::Value> checkValue = GetPrivate(nodeObj, Nan::New("NodeGitPromiseError").ToLocalChecked());

        if (!checkValue.IsEmpty() && !checkValue->IsNull() && !checkValue->IsUndefined()) {
          v8::Local<v8::Value> argv[1] = {
            checkValue->ToObject()
          };
          callback->Call(1, argv);
          callbackFired = true;
          break;
        }

        v8::Local<v8::Array> properties = nodeObj->GetPropertyNames();
        for (unsigned int propIndex = 0; propIndex < properties->Length(); ++propIndex) {
          v8::Local<v8::String> propName = properties->Get(propIndex)->ToString();
          v8::Local<v8::Value> nodeToQueue = nodeObj->Get(propName);
          if (!nodeToQueue->IsUndefined()) {
            workerArguments.push(nodeToQueue);
          }
        }
      }

      if (!callbackFired) {
        v8::Local<v8::Object> err = Nan::Error("Method setUrl has thrown an error.")->ToObject();
        err->Set(Nan::New("errno").ToLocalChecked(), Nan::New(baton->error_code));
        v8::Local<v8::Value> argv[1] = {
          err
        };
        callback->Call(1, argv);
      }
    } else {
      callback->Call(0, NULL);
    }

  }


  delete baton;
}

  
/*
  * @param Repository repo
   * @param String name
   * @param Number ignore
    * @param Number callback
   */
NAN_METHOD(GitSubmodule::Status) {

  if (info.Length() == 0 || !info[0]->IsObject()) {
    return Nan::ThrowError("Repository repo is required.");
  }

  if (info.Length() == 1 || !info[1]->IsString()) {
    return Nan::ThrowError("String name is required.");
  }

  if (info.Length() == 2 || !info[2]->IsNumber()) {
    return Nan::ThrowError("Number ignore is required.");
  }

  if (info.Length() == 3 || !info[3]->IsFunction()) {
    return Nan::ThrowError("Callback is required and must be a Function.");
  }

  StatusBaton* baton = new StatusBaton;

  baton->error_code = GIT_OK;
  baton->error = NULL;

      baton->status = (unsigned int *)malloc(sizeof(unsigned int ));  
// start convert_from_v8 block
  git_repository * from_repo = NULL;
from_repo = Nan::ObjectWrap::Unwrap<GitRepository>(info[0]->ToObject())->GetValue();
// end convert_from_v8 block
  baton->repo = from_repo;
// start convert_from_v8 block
  const char * from_name = NULL;

  String::Utf8Value name(info[1]->ToString());
  // malloc with one extra byte so we can add the terminating null character C-strings expect:
  from_name = (const char *) malloc(name.length() + 1);
  // copy the characters from the nodejs string into our C-string (used instead of strdup or strcpy because nulls in
  // the middle of strings are valid coming from nodejs):
  memcpy((void *)from_name, *name, name.length());
  // ensure the final byte of our new string is null, extra casts added to ensure compatibility with various C types
  // used in the nodejs binding generation:
  memset((void *)(((char *)from_name) + name.length()), 0, 1);
// end convert_from_v8 block
  baton->name = from_name;
// start convert_from_v8 block
  git_submodule_ignore_t from_ignore;
  from_ignore = (git_submodule_ignore_t)  (int) info[2]->ToNumber()->Value();
// end convert_from_v8 block
  baton->ignore = from_ignore;

  Nan::Callback *callback = new Nan::Callback(v8::Local<Function>::Cast(info[3]));
  StatusWorker *worker = new StatusWorker(baton, callback);
  if (!info[0]->IsUndefined() && !info[0]->IsNull())
    worker->SaveToPersistent("repo", info[0]->ToObject());
  if (!info[1]->IsUndefined() && !info[1]->IsNull())
    worker->SaveToPersistent("name", info[1]->ToObject());
  if (!info[2]->IsUndefined() && !info[2]->IsNull())
    worker->SaveToPersistent("ignore", info[2]->ToObject());

  AsyncLibgit2QueueWorker(worker);
  return;
}

void GitSubmodule::StatusWorker::Execute() {
  giterr_clear();

  {
    LockMaster lockMaster(/*asyncAction: */true        ,baton->status
        ,baton->repo
        ,baton->name
);

  int result = git_submodule_status(
baton->status,baton->repo,baton->name,baton->ignore    );

    baton->error_code = result;

    if (result != GIT_OK && giterr_last() != NULL) {
      baton->error = git_error_dup(giterr_last());
    }

  }
}

void GitSubmodule::StatusWorker::HandleOKCallback() {
  if (baton->error_code == GIT_OK) {
    v8::Local<v8::Value> to;
// start convert_to_v8 block
     to = Nan::New<Number>(* baton->status);
  // end convert_to_v8 block
    v8::Local<v8::Value> result = to;
    v8::Local<v8::Value> argv[2] = {
      Nan::Null(),
      result
    };
    callback->Call(2, argv);
  } else {
    if (baton->error) {
      v8::Local<v8::Object> err;
      if (baton->error->message) {
        err = Nan::Error(baton->error->message)->ToObject();
      } else {
        err = Nan::Error("Method status has thrown an error.")->ToObject();
      }
      err->Set(Nan::New("errno").ToLocalChecked(), Nan::New(baton->error_code));
      v8::Local<v8::Value> argv[1] = {
        err
      };
      callback->Call(1, argv);
      if (baton->error->message)
        free((void *)baton->error->message);
      free((void *)baton->error);
    } else if (baton->error_code < 0) {
      std::queue< v8::Local<v8::Value> > workerArguments;
      workerArguments.push(GetFromPersistent("repo"));
      workerArguments.push(GetFromPersistent("name"));
      workerArguments.push(GetFromPersistent("ignore"));
      bool callbackFired = false;
      while(!workerArguments.empty()) {
        v8::Local<v8::Value> node = workerArguments.front();
        workerArguments.pop();

        if (
          !node->IsObject()
          || node->IsArray()
          || node->IsBooleanObject()
          || node->IsDate()
          || node->IsFunction()
          || node->IsNumberObject()
          || node->IsRegExp()
          || node->IsStringObject()
        ) {
          continue;
        }

        v8::Local<v8::Object> nodeObj = node->ToObject();
        v8::Local<v8::Value> checkValue = GetPrivate(nodeObj, Nan::New("NodeGitPromiseError").ToLocalChecked());

        if (!checkValue.IsEmpty() && !checkValue->IsNull() && !checkValue->IsUndefined()) {
          v8::Local<v8::Value> argv[1] = {
            checkValue->ToObject()
          };
          callback->Call(1, argv);
          callbackFired = true;
          break;
        }

        v8::Local<v8::Array> properties = nodeObj->GetPropertyNames();
        for (unsigned int propIndex = 0; propIndex < properties->Length(); ++propIndex) {
          v8::Local<v8::String> propName = properties->Get(propIndex)->ToString();
          v8::Local<v8::Value> nodeToQueue = nodeObj->Get(propName);
          if (!nodeToQueue->IsUndefined()) {
            workerArguments.push(nodeToQueue);
          }
        }
      }

      if (!callbackFired) {
        v8::Local<v8::Object> err = Nan::Error("Method status has thrown an error.")->ToObject();
        err->Set(Nan::New("errno").ToLocalChecked(), Nan::New(baton->error_code));
        v8::Local<v8::Value> argv[1] = {
          err
        };
        callback->Call(1, argv);
      }
    } else {
      callback->Call(0, NULL);
    }

  }


  delete baton;
}

  
/*
     */
NAN_METHOD(GitSubmodule::Sync) {

  if (info.Length() == 0 || !info[0]->IsFunction()) {
    return Nan::ThrowError("Callback is required and must be a Function.");
  }

  SyncBaton* baton = new SyncBaton;

  baton->error_code = GIT_OK;
  baton->error = NULL;

  baton->submodule = Nan::ObjectWrap::Unwrap<GitSubmodule>(info.This())->GetValue();

  Nan::Callback *callback = new Nan::Callback(v8::Local<Function>::Cast(info[0]));
  SyncWorker *worker = new SyncWorker(baton, callback);
  worker->SaveToPersistent("submodule", info.This());

  AsyncLibgit2QueueWorker(worker);
  return;
}

void GitSubmodule::SyncWorker::Execute() {
  giterr_clear();

  {
    LockMaster lockMaster(/*asyncAction: */true        ,baton->submodule
);

  int result = git_submodule_sync(
baton->submodule    );

    baton->error_code = result;

    if (result != GIT_OK && giterr_last() != NULL) {
      baton->error = git_error_dup(giterr_last());
    }

  }
}

void GitSubmodule::SyncWorker::HandleOKCallback() {
  if (baton->error_code == GIT_OK) {
    v8::Local<v8::Value> result = Nan::Undefined();
    v8::Local<v8::Value> argv[2] = {
      Nan::Null(),
      result
    };
    callback->Call(2, argv);
  } else {
    if (baton->error) {
      v8::Local<v8::Object> err;
      if (baton->error->message) {
        err = Nan::Error(baton->error->message)->ToObject();
      } else {
        err = Nan::Error("Method sync has thrown an error.")->ToObject();
      }
      err->Set(Nan::New("errno").ToLocalChecked(), Nan::New(baton->error_code));
      v8::Local<v8::Value> argv[1] = {
        err
      };
      callback->Call(1, argv);
      if (baton->error->message)
        free((void *)baton->error->message);
      free((void *)baton->error);
    } else if (baton->error_code < 0) {
      std::queue< v8::Local<v8::Value> > workerArguments;
      bool callbackFired = false;
      while(!workerArguments.empty()) {
        v8::Local<v8::Value> node = workerArguments.front();
        workerArguments.pop();

        if (
          !node->IsObject()
          || node->IsArray()
          || node->IsBooleanObject()
          || node->IsDate()
          || node->IsFunction()
          || node->IsNumberObject()
          || node->IsRegExp()
          || node->IsStringObject()
        ) {
          continue;
        }

        v8::Local<v8::Object> nodeObj = node->ToObject();
        v8::Local<v8::Value> checkValue = GetPrivate(nodeObj, Nan::New("NodeGitPromiseError").ToLocalChecked());

        if (!checkValue.IsEmpty() && !checkValue->IsNull() && !checkValue->IsUndefined()) {
          v8::Local<v8::Value> argv[1] = {
            checkValue->ToObject()
          };
          callback->Call(1, argv);
          callbackFired = true;
          break;
        }

        v8::Local<v8::Array> properties = nodeObj->GetPropertyNames();
        for (unsigned int propIndex = 0; propIndex < properties->Length(); ++propIndex) {
          v8::Local<v8::String> propName = properties->Get(propIndex)->ToString();
          v8::Local<v8::Value> nodeToQueue = nodeObj->Get(propName);
          if (!nodeToQueue->IsUndefined()) {
            workerArguments.push(nodeToQueue);
          }
        }
      }

      if (!callbackFired) {
        v8::Local<v8::Object> err = Nan::Error("Method sync has thrown an error.")->ToObject();
        err->Set(Nan::New("errno").ToLocalChecked(), Nan::New(baton->error_code));
        v8::Local<v8::Value> argv[1] = {
          err
        };
        callback->Call(1, argv);
      }
    } else {
      callback->Call(0, NULL);
    }

  }


  delete baton;
}

  
/*
   * @param Number init
   * @param SubmoduleUpdateOptions options
     */
NAN_METHOD(GitSubmodule::Update) {

  if (info.Length() == 0 || !info[0]->IsNumber()) {
    return Nan::ThrowError("Number init is required.");
  }

  if (info.Length() == 2 || !info[2]->IsFunction()) {
    return Nan::ThrowError("Callback is required and must be a Function.");
  }

  UpdateBaton* baton = new UpdateBaton;

  baton->error_code = GIT_OK;
  baton->error = NULL;

  baton->submodule = Nan::ObjectWrap::Unwrap<GitSubmodule>(info.This())->GetValue();
// start convert_from_v8 block
  int from_init;
  from_init = (int)   info[0]->ToNumber()->Value();
// end convert_from_v8 block
  baton->init = from_init;
// start convert_from_v8 block
  git_submodule_update_options * from_options = NULL;
    if (info[1]->IsObject()) {
from_options = Nan::ObjectWrap::Unwrap<GitSubmoduleUpdateOptions>(info[1]->ToObject())->GetValue();
  }
  else {
    from_options = 0;
  }
// end convert_from_v8 block
  baton->options = from_options;

  Nan::Callback *callback = new Nan::Callback(v8::Local<Function>::Cast(info[2]));
  UpdateWorker *worker = new UpdateWorker(baton, callback);
  worker->SaveToPersistent("submodule", info.This());
  if (!info[0]->IsUndefined() && !info[0]->IsNull())
    worker->SaveToPersistent("init", info[0]->ToObject());
  if (!info[1]->IsUndefined() && !info[1]->IsNull())
    worker->SaveToPersistent("options", info[1]->ToObject());

  AsyncLibgit2QueueWorker(worker);
  return;
}

void GitSubmodule::UpdateWorker::Execute() {
  giterr_clear();

  {
    LockMaster lockMaster(/*asyncAction: */true        ,baton->submodule
        ,baton->options
);

  int result = git_submodule_update(
baton->submodule,baton->init,baton->options    );

    baton->error_code = result;

    if (result != GIT_OK && giterr_last() != NULL) {
      baton->error = git_error_dup(giterr_last());
    }

  }
}

void GitSubmodule::UpdateWorker::HandleOKCallback() {
  if (baton->error_code == GIT_OK) {
    v8::Local<v8::Value> result = Nan::Undefined();
    v8::Local<v8::Value> argv[2] = {
      Nan::Null(),
      result
    };
    callback->Call(2, argv);
  } else {
    if (baton->error) {
      v8::Local<v8::Object> err;
      if (baton->error->message) {
        err = Nan::Error(baton->error->message)->ToObject();
      } else {
        err = Nan::Error("Method update has thrown an error.")->ToObject();
      }
      err->Set(Nan::New("errno").ToLocalChecked(), Nan::New(baton->error_code));
      v8::Local<v8::Value> argv[1] = {
        err
      };
      callback->Call(1, argv);
      if (baton->error->message)
        free((void *)baton->error->message);
      free((void *)baton->error);
    } else if (baton->error_code < 0) {
      std::queue< v8::Local<v8::Value> > workerArguments;
      workerArguments.push(GetFromPersistent("init"));
      workerArguments.push(GetFromPersistent("options"));
      bool callbackFired = false;
      while(!workerArguments.empty()) {
        v8::Local<v8::Value> node = workerArguments.front();
        workerArguments.pop();

        if (
          !node->IsObject()
          || node->IsArray()
          || node->IsBooleanObject()
          || node->IsDate()
          || node->IsFunction()
          || node->IsNumberObject()
          || node->IsRegExp()
          || node->IsStringObject()
        ) {
          continue;
        }

        v8::Local<v8::Object> nodeObj = node->ToObject();
        v8::Local<v8::Value> checkValue = GetPrivate(nodeObj, Nan::New("NodeGitPromiseError").ToLocalChecked());

        if (!checkValue.IsEmpty() && !checkValue->IsNull() && !checkValue->IsUndefined()) {
          v8::Local<v8::Value> argv[1] = {
            checkValue->ToObject()
          };
          callback->Call(1, argv);
          callbackFired = true;
          break;
        }

        v8::Local<v8::Array> properties = nodeObj->GetPropertyNames();
        for (unsigned int propIndex = 0; propIndex < properties->Length(); ++propIndex) {
          v8::Local<v8::String> propName = properties->Get(propIndex)->ToString();
          v8::Local<v8::Value> nodeToQueue = nodeObj->Get(propName);
          if (!nodeToQueue->IsUndefined()) {
            workerArguments.push(nodeToQueue);
          }
        }
      }

      if (!callbackFired) {
        v8::Local<v8::Object> err = Nan::Error("Method update has thrown an error.")->ToObject();
        err->Set(Nan::New("errno").ToLocalChecked(), Nan::New(baton->error_code));
        v8::Local<v8::Value> argv[1] = {
          err
        };
        callback->Call(1, argv);
      }
    } else {
      callback->Call(0, NULL);
    }

  }


  delete baton;
}

   
/*
 * @param SubmoduleUpdateOptions opts
   * @param Number version
     * @return Number  result    */
NAN_METHOD(GitSubmodule::UpdateInitOptions) {
  Nan::EscapableHandleScope scope;

  if (info.Length() == 0 || !info[0]->IsObject()) {
    return Nan::ThrowError("SubmoduleUpdateOptions opts is required.");
  }

  if (info.Length() == 1 || !info[1]->IsNumber()) {
    return Nan::ThrowError("Number version is required.");
  }

// start convert_from_v8 block
  git_submodule_update_options * from_opts = NULL;
from_opts = Nan::ObjectWrap::Unwrap<GitSubmoduleUpdateOptions>(info[0]->ToObject())->GetValue();
// end convert_from_v8 block
// start convert_from_v8 block
  unsigned int from_version;
  from_version = (unsigned int)   info[1]->ToNumber()->Value();
// end convert_from_v8 block
 
  giterr_clear();

  {
    LockMaster lockMaster(/*asyncAction: */false        ,    from_opts
);

    int result = git_submodule_update_init_options(
  from_opts
,  from_version
    );

 
    v8::Local<v8::Value> to;
// start convert_to_v8 block
     to = Nan::New<Number>( result);
  // end convert_to_v8 block
    return info.GetReturnValue().Set(scope.Escape(to));
  }
}
   
/*
     * @return Number  result    */
NAN_METHOD(GitSubmodule::UpdateStrategy) {
  Nan::EscapableHandleScope scope;

 
  giterr_clear();

  {
    LockMaster lockMaster(/*asyncAction: */false        ,    Nan::ObjectWrap::Unwrap<GitSubmodule>(info.This())->GetValue()
);

    git_submodule_update_t result = git_submodule_update_strategy(
  Nan::ObjectWrap::Unwrap<GitSubmodule>(info.This())->GetValue()
    );

 
    v8::Local<v8::Value> to;
// start convert_to_v8 block
     to = Nan::New<Number>( result);
  // end convert_to_v8 block
    return info.GetReturnValue().Set(scope.Escape(to));
  }
}
   
/*
     * @return String  result    */
NAN_METHOD(GitSubmodule::Url) {
  Nan::EscapableHandleScope scope;

 
  giterr_clear();

  {
    LockMaster lockMaster(/*asyncAction: */false        ,    Nan::ObjectWrap::Unwrap<GitSubmodule>(info.This())->GetValue()
);

    const char * result = git_submodule_url(
  Nan::ObjectWrap::Unwrap<GitSubmodule>(info.This())->GetValue()
    );

     // null checks on pointers
    if (!result) {
      return info.GetReturnValue().Set(scope.Escape(Nan::Undefined()));
    }

    v8::Local<v8::Value> to;
// start convert_to_v8 block
  if (result){
       to = Nan::New<String>(result).ToLocalChecked();
   }
  else {
    to = Nan::Null();
  }

  // end convert_to_v8 block
    return info.GetReturnValue().Set(scope.Escape(to));
  }
}
   
/*
     * @return Oid  result    */
NAN_METHOD(GitSubmodule::WdId) {
  Nan::EscapableHandleScope scope;

 
  giterr_clear();

  {
    LockMaster lockMaster(/*asyncAction: */false        ,    Nan::ObjectWrap::Unwrap<GitSubmodule>(info.This())->GetValue()
);

    const git_oid * result = git_submodule_wd_id(
  Nan::ObjectWrap::Unwrap<GitSubmodule>(info.This())->GetValue()
    );

     // null checks on pointers
    if (!result) {
      return info.GetReturnValue().Set(scope.Escape(Nan::Undefined()));
    }

    v8::Local<v8::Value> to;
// start convert_to_v8 block
  
  if (result != NULL) {
    // GitOid result
       to = GitOid::New(result, true , info.This() );
   }
  else {
    to = Nan::Null();
  }

 // end convert_to_v8 block
    return info.GetReturnValue().Set(scope.Escape(to));
  }
}
    // force base class template instantiation, to make sure we get all the
// methods, statics, etc.
template class NodeGitWrapper<GitSubmoduleTraits>;
 