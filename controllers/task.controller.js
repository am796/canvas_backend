const Task = require('../models/Task');

const getTasks = async (req, res) => {
  try {
    const userId = req.user.id; // numeric id
    const { search = '', page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    console.log('Getting tasks for user:', userId);

    let query = { user_id: userId };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    console.log('Query:', JSON.stringify(query));

    const total = await Task.countDocuments(query);
    const tasks = await Task.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    console.log('Found tasks:', tasks.length, 'Total:', total);

    // Transform tasks to match expected format
    const formattedTasks = tasks.map(task => ({
      id: task.id,
      user_id: task.user_id,
      title: task.title,
      description: task.description,
      status: task.status,
      created_at: task.created_at,
      updated_at: task.updated_at
    }));

    res.json({
      tasks: formattedTasks,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('getTasks error:', err);
    return res.status(500).json({ error: 'Database error' });
  }
};

const createTask = async (req, res) => {
  try {
    const userId = req.user.id; // numeric id
    const { title, description, status = 'pending' } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const task = new Task({
      user_id: userId,
      title,
      description: description || '',
      status
    });

    await task.save();

    res.status(201).json({
      message: 'Task created successfully',
      task: {
        id: task.id,
        user_id: task.user_id,
        title: task.title,
        description: task.description,
        status: task.status
      }
    });
  } catch (err) {
    console.error('createTask error:', err);
    return res.status(500).json({ error: 'Error creating task' });
  }
};

const updateTask = async (req, res) => {
  try {
    const userId = req.user.id; // numeric id
    const { id } = req.params;
    const { title, description, status } = req.body;

    const task = await Task.findOne({ id: parseInt(id), user_id: userId });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status) updateData.status = status;

    await Task.updateOne({ id: parseInt(id) }, updateData);

    res.json({ message: 'Task updated successfully' });
  } catch (err) {
    console.error('updateTask error:', err);
    return res.status(500).json({ error: 'Error updating task' });
  }
};

const deleteTask = async (req, res) => {
  try {
    const userId = req.user.id; // numeric id
    const { id } = req.params;

    const task = await Task.findOne({ id: parseInt(id), user_id: userId });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await Task.deleteOne({ id: parseInt(id) });

    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error('deleteTask error:', err);
    return res.status(500).json({ error: 'Error deleting task' });
  }
};

module.exports = {
  getTasks,
  createTask,
  updateTask,
  deleteTask
};
