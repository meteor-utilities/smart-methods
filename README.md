# Smart Methods

Create methods based on your collection schema

### Install

```
meteor add utilities:smart-methods
```

### Usage

#### Initialize your methods:

```
Tasks.initMethods({
  deleteIf: function (userId, document) {
    return userId === document.owner;
  },
  createCallback: function (document) {
    document = _.extend(document, {
      createdAt: new Date(),
      owner: Meteor.userId(),
      username: Meteor.user().username
    });
    return document;
  },
  editCallback: function (modifier) {
    modifier.$set.editedAt = new Date();
    return modifier;
  }
});
```

- `deleteIf`: a function called when deleting a document.
- `createCallback`: a function called on a document being created.
- `editCallback`: a function called on a document beind modified.

#### Define your schema

```js
const hasUserId = function (userId) {
  return !!userId;
}

const isOwner = function (userId, document) {
  return userId === document.owner;
}

const tasksSchema = new SimpleSchema({
  text: {
    type: String,
    public: true,
    createIf: hasUserId,
    editIf: isOwner
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
    editIf: function (userId, document) {
      if (document.private) {
        return userId === document.owner;
      } else {
        return true;
      }
    }
  },
  private: {
    type: Boolean,
    public: true, 
    editIf: isOwner
  }
});
Tasks.attachSchema(tasksSchema);
```