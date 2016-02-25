SimpleSchema.extendOptions({
  createIf: Match.Optional(Function),
  editIf: Match.Optional(Function)
});

Mongo.Collection.prototype.initMethods = function (options) {

  const collection = this;
  const collectionName = collection._name;
  const schema = collection.simpleSchema();
  const ownerProperty = options.ownerProperty;
  const methods = {};

  methods[collectionName+".create"] = function (document) {

    check(document, Object);

    const userId = this.userId;

    // check that the user is logged in
    if (!userId) {
      throw new Meteor.Error("not_logged_in", "Sorry, you need to be logged in.");
    }

    // go over each schema field and throw an error if it's not in the schema or not editable
    _.keys(document).forEach(function (fieldName) {
      const field = schema._schema[fieldName];
      if (!(field && field.createIf && field.createIf(userId))) {
        throw new Meteor.Error("disallowed_property", "Disallowed property detected at creation: " + fieldName);
      }
    });

    if (options.createCallback) {
      document = options.createCallback(document);
    }

    collection.insert(document);
  };

  methods[collectionName+".edit"] = function (documentId, modifier) {

    check(documentId, String);
    check(modifier, Match.OneOf({$set: Object}, {$unset: Object}, {$set: Object, $unset: Object}));

    const userId = this.userId;
    const document = collection.findOne(documentId);

    // verify that the current user owns the document being edited
    // if (document[ownerProperty] !== this.userId) {
    //   throw new Meteor.Error("disallowed_user", "You do not have the rights to edit this document");
    // }

    // go over each schema field and throw an error if it's not editable
    // loop over each operation ($set, $unset, etc.)
    _.each(modifier, function (operation) {
      // loop over each property being operated on
      _.keys(operation).forEach(function (fieldName) {
        const field = schema._schema[fieldName];
        if (!(field && field.editIf && field.editIf(userId, document))) {
          throw new Meteor.Error("disallowed_property", "Disallowed property detected at edit: " + fieldName);
        }
      });
    });
  
    if (options.editCallback) {
      modifier = options.editCallback(modifier);
    }
    
    collection.update(documentId, modifier);
  };

  methods[collectionName+".delete"] = function (documentId) {

    check(documentId, String);

    const userId = this.userId;
    const document = collection.findOne(documentId);

    // verify that the current user can delete the document
    if (!options.deleteIf(userId, document)) {
      throw new Meteor.Error("disallowed_user", "You do not have the rights to delete this document");
    }

    collection.remove(documentId);
  };

  Meteor.methods(methods);

};