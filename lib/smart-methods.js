SimpleSchema.extendOptions({
  insertableIf: Match.Optional(Function),
  editableIf: Match.Optional(Function)
});

Mongo.Collection.prototype.smartMethods = function (options) {

  const collection = this;
  const collectionName = collection._name;
  const schema = collection.simpleSchema();
  const methods = {};

  if (options.createName) {
    methods[options.createName] = function (document) {

      const currentUser = Meteor.users.findOne(this.userId);

      // check that the user is logged in
      if (!this.userId) {
        throw new Meteor.Error("not_logged_in", "Sorry, you need to be logged in.");
      }

      // go over each schema field and throw an error if it's not in the schema or not editable
      _.keys(document).forEach(function (fieldName) {
        const field = schema._schema[fieldName];
        if (!canInsertField(currentUser, field)) {
          throw new Meteor.Error("disallowed_property", "Disallowed property detected at insert: " + fieldName);
        }
      });

      // run callback if provided
      if (options.createCallback) {
        document = options.createCallback(currentUser, document);
      }

      return collection.insert(document);
    };
  }

  if (options.editName) {
    methods[options.editName] = function (documentId, modifier) {

      check(documentId, String);
      check(modifier, Match.OneOf({$set: Object}, {$unset: Object}, {$set: Object, $unset: Object}));

      const currentUser = Meteor.users.findOne(this.userId);
      const document = collection.findOne(documentId);

      // check that the user is logged in
      if (!this.userId) {
        throw new Meteor.Error("not_logged_in", "Sorry, you need to be logged in.");
      }

      // go over each schema field and throw an error if it's not editable
      // loop over each operation ($set, $unset, etc.)
      _.each(modifier, function (operation) {
        // loop over each property being operated on
        _.keys(operation).forEach(function (fieldName) {
          const field = schema._schema[fieldName];
          if (!canEditDocumentField(currentUser, document, field)) {
            throw new Meteor.Error("disallowed_property", "Disallowed property detected at edit: " + fieldName);
          }
        });
      });
    
      // run callback if provided
      if (options.editCallback) {
        modifier = options.editCallback(currentUser, modifier, document);
      }
      
      return collection.update(documentId, modifier);
    };
  }

  if (options.deleteName && options.deleteCallback) {
    methods[options.deleteName] = function (documentId) {

      check(documentId, String);

      const currentUser = Meteor.users.findOne(this.userId);
      const document = collection.findOne(documentId);

      // check that the user is logged in
      if (!this.userId) {
        throw new Meteor.Error("not_logged_in", "Sorry, you need to be logged in.");
      }

      // callback is necessary
      if (options.deleteCallback(currentUser, document) !== false) {
        return collection.remove(documentId);
      } else {
        throw new Meteor.Error("cannot_delete", "You do not have the rights to delete this document.");
      }
    };
  }
  
  Meteor.methods(methods);

};

/**
 * @method Mongo.Collection.getInsertableFields
 * Get an array of all fields editable by a specific user for a given collection
 * @param {Object} user – the user for which to check field permissions
 */
Mongo.Collection.prototype.getInsertableFields = function (user) {
  
  const collection = this;
  const schema = collection.simpleSchema()._schema;
  
  const fields = _.filter(_.keys(schema), function (fieldName) {
    var field = schema[fieldName];
    return field.insertableIf && field.insertableIf(user);
  });

  return fields;
};

/**
 * @method Mongo.Collection.getEditableFields
 * Get an array of all fields editable by a specific user for a given collection
 * @param {Object} user – the user for which to check field permissions
 */
Mongo.Collection.prototype.getEditableFields = function (user, document) {
  
  const collection = this;
  const schema = collection.simpleSchema()._schema;
  
  const fields = _.filter(_.keys(schema), function (fieldName) {
    var field = schema[fieldName];
    return field.editableIf && field.editableIf(user, document);
  });

  return fields;
};


const canInsertField = (user, field) => {
  return field && field.insertableIf && field.insertableIf(user);
}

const canEditDocumentField = (user, document, field) => {
  return field && field.editableIf && field.editableIf(user, document);
}