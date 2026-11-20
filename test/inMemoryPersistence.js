import mongoose from 'mongoose';
import User from '../src/models/user.model.js';
import Order from '../src/models/order.model.js';
import Delivery from '../src/models/delivery.model.js';
import Product from '../src/models/product.model.js';

const stores = {
  User: [],
  Order: [],
  Delivery: [],
  Product: []
};

export const clearMemoryStores = () => {
  stores.User = [];
  stores.Order = [];
  stores.Delivery = [];
  stores.Product = [];
};

const toPlainObject = (doc) => {
  if (!doc) return null;
  const plain = JSON.parse(JSON.stringify(doc));
  return plain;
};

const matchesFilter = (item, filter = {}) => {
  for (const [key, val] of Object.entries(filter)) {
    if (val && typeof val === 'object' && '$gt' in val) {
      if (!(item[key] > val.$gt)) return false;
    } else if (String(item[key]) !== String(val)) {
      return false;
    }
  }
  return true;
};

const createChainableQuery = (getResultFn) => {
  const query = {
    _populateFields: [],
    _skipCount: 0,
    _limitCount: null,
    populate(field) {
      this._populateFields.push(field);
      return this;
    },
    sort() {
      return this;
    },
    skip(n) {
      this._skipCount = Number(n) || 0;
      return this;
    },
    limit(n) {
      this._limitCount = Number(n);
      return this;
    },
    async exec() {
      const all = await getResultFn(this._populateFields);
      if (!Array.isArray(all)) return all;
      const start = Math.max(0, this._skipCount);
      const sliced = all.slice(start);
      if (this._limitCount !== null && !isNaN(this._limitCount) && this._limitCount >= 0) {
        return sliced.slice(0, this._limitCount);
      }
      return sliced;
    },
    then(resolve, reject) {
      return this.exec().then(resolve, reject);
    }
  };
  return query;
};

const attachModelMemoryAdapter = (Model, storeName) => {
  Model.deleteMany = async () => {
    const deletedCount = stores[storeName].length;
    stores[storeName] = [];
    return { acknowledged: true, deletedCount };
  };

  Model.countDocuments = async (filter = {}) => {
    return stores[storeName].filter((item) => matchesFilter(item, filter)).length;
  };

  Model.create = async (data) => {
    const instance = new Model(data);
    await instance.validate();
    const obj = instance.toObject();
    if (!obj._id) {
      obj._id = new mongoose.Types.ObjectId();
    }
    const now = new Date().toISOString();
    const record = {
      ...toPlainObject(obj),
      _id: obj._id,
      createdAt: now,
      updatedAt: now
    };
    stores[storeName].push(record);
    return record;
  };

  Model.insertMany = async (items = []) => {
    const created = [];
    for (const item of items) {
      const rec = await Model.create(item);
      created.push(rec);
    }
    return created;
  };

  Model.find = (filter = {}) => {
    return createChainableQuery(async (populateFields) => {
      const results = stores[storeName]
        .filter((item) => matchesFilter(item, filter))
        .map((item) => ({ ...item }));

      for (const rec of results) {
        if (populateFields.includes('customer') && rec.customer) {
          const foundUser = stores.User.find((u) => String(u._id) === String(rec.customer));
          if (foundUser) rec.customer = { ...foundUser };
        }
        if (populateFields.includes('driver') && rec.driver) {
          const foundDriver = stores.User.find((u) => String(u._id) === String(rec.driver));
          if (foundDriver) rec.driver = { ...foundDriver };
        }
        if (populateFields.includes('order') && rec.order) {
          const foundOrder = stores.Order.find((o) => String(o._id) === String(rec.order));
          if (foundOrder) rec.order = { ...foundOrder };
        }
      }
      return results;
    });
  };

  Model.findOne = (filter = {}) => {
    return createChainableQuery(async () => {
      const found = stores[storeName].find((item) => matchesFilter(item, filter));
      return found ? { ...found } : null;
    });
  };

  Model.findById = (id) => {
    return createChainableQuery(async (populateFields) => {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        const castErr = new Error(`Cast to ObjectId failed for value "${id}"`);
        castErr.name = 'CastError';
        throw castErr;
      }
      const found = stores[storeName].find((item) => String(item._id) === String(id));
      if (!found) return null;
      const copy = { ...found };
      if (populateFields.includes('customer') && copy.customer) {
        const foundUser = stores.User.find((u) => String(u._id) === String(copy.customer));
        if (foundUser) copy.customer = { ...foundUser };
      }
      if (populateFields.includes('driver') && copy.driver) {
        const foundDriver = stores.User.find((u) => String(u._id) === String(copy.driver));
        if (foundDriver) copy.driver = { ...foundDriver };
      }
      if (populateFields.includes('order') && copy.order) {
        const foundOrder = stores.Order.find((o) => String(o._id) === String(copy.order));
        if (foundOrder) copy.order = { ...foundOrder };
      }
      return copy;
    });
  };

  Model.findByIdAndUpdate = (id, updateData = {}) => {
    return createChainableQuery(async () => {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        const castErr = new Error(`Cast to ObjectId failed for value "${id}"`);
        castErr.name = 'CastError';
        throw castErr;
      }
      const idx = stores[storeName].findIndex((item) => String(item._id) === String(id));
      if (idx === -1) return null;
      stores[storeName][idx] = {
        ...stores[storeName][idx],
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      return { ...stores[storeName][idx] };
    });
  };

  Model.findByIdAndDelete = (id) => {
    return createChainableQuery(async () => {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        const castErr = new Error(`Cast to ObjectId failed for value "${id}"`);
        castErr.name = 'CastError';
        throw castErr;
      }
      const idx = stores[storeName].findIndex((item) => String(item._id) === String(id));
      if (idx === -1) return null;
      const [removed] = stores[storeName].splice(idx, 1);
      return removed;
    });
  };
};

export const enableInMemoryTestPersistence = () => {
  attachModelMemoryAdapter(User, 'User');
  attachModelMemoryAdapter(Order, 'Order');
  attachModelMemoryAdapter(Delivery, 'Delivery');
  attachModelMemoryAdapter(Product, 'Product');
};
