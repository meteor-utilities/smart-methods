# Smart Methods

This package defines a convention for storing field edition rules in your collection schema.

Aditionally, it can also automatically create default methods based on these rules.

#### [Watch 5-minute intro video](https://www.youtube.com/watch?v=jp04IowUxTI&feature=youtu.be)

### Install

```
meteor add utilities:smart-methods
```

### Schema Definition

The package provides two new properties.

- `insertableIf (user)`: called on the `user` performing the operation, should return `true` or `false`.
- `editableIf (user, document)`: called on the `user` performing the operation, and the `document` being operated on, and should return `true` or `false`.

```js
Tasks = new Mongo.Collection("tasks");

const isLoggedIn = function (user) {
  return !!user;
}

const isOwner = function (user, document) {
  return user._id === document.owner;
}

const tasksSchema = new SimpleSchema({
  text: {
    type: String,
    public: true,
    insertableIf: isLoggedIn,
    editableIf: isOwner
  },
  createdAt: {
    type: Date,
    public: true
  },
  owner: {
    type: String,
    public: true
  },
  checked: {
    type: Boolean,
    public: true, 
    insertableIf: isLoggedIn,
    editableIf: function (user, document) {
      if (document.private) {
        return user._id === document.owner;
      } else {
        return true;
      }
    }
  },
  private: {
    type: Boolean,
    public: true, 
    insertableIf: isLoggedIn,
    editableIf: isOwner
  }
});

Tasks.attachSchema(tasksSchema);
```

### Smart Methods

This package can optionally creates three default methods based on your schema. Assuming your collection is declared with:

`Tasks = new Mongo.Collection("tasks");`

Your methods will be:

- `tasks.create(document)`
- `tasks.edit(documentId, modifier)`
- `tasks.delete(documentId)`

You can create these methods by calling `Collection.smartMethods()`, with the following options:

- `createCallback (currentUser, document)` [optional]: called before a document is created. Should return a document.
- `editCallback (currentUser, modifier, originalDocument)` [optional]: called before a document is edited. Should return a Mongo modifier. 
- `deleteCallback (currentUser, document)` [required]: called before a document is deleted. The document will not be deleted if this returns `false`. Note that the `delete` method will return whatever the callback returns. 
- `createName`, `editName`, `deleteName` [optional]: lets you specify names for each method. 

```
Tasks.smartMethods({
  createCallback: function (currentUser, document) {
    document = _.extend(document, {
      createdAt: new Date(),
      owner: currentUser._id,
      username: currentUser.username
    });
    return document;
  },
  editCallback: function (currentUser, modifier, originalDocument) {
    modifier.$set.editedAt = new Date();
    return modifier;
  },
  deleteCallback: function (currentUser, document) {
    return currentUser._id === document.userId;
  }
});
```

### Other Methods

##### `Collection.getInsertableFields(user)`

For a specific user, get an array of all the fields they have access to in a collection.

##### `Collection.getEditableFields(user, document)`

For a specific user and document, get an array of all the fields they can modify in this specific document.