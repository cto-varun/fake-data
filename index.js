const faker = require('faker');
const day = require('dayjs');
const zipObject = require('lodash.zipobject');

const STEP_REGEXP = /^([0-9])+(d|day|M|month|y|year|h|hour|m|minute|s|second|ms|millisecond)$/;
const FIELD_NAME = 0;
const RANDOM_TYPE = 1;

/**
 * Express middleware which cleanups input for /fake-data endpoint
 *
 * @param {Request} req
 * @param {*} _
 * @param {Function} next Next middleware execution
 */
function inputCleanup(query, next) {
    const validDate = (date) =>
        date && day(date).isValid() ? day(date) : false;
    let {
        fields = [],
        step,
        offset,
        limit,
        startDate,
        endDate,
        flat = false,
    } = query;

    // Type convertion & input cleanup
    limit = +limit || 24;
    offset = +offset || 0;
    startDate = validDate(startDate) || day().startOf('day');
    endDate = validDate(endDate) || day().endOf('day');
    fields = [].concat(fields).map((field) => field.split(':'));
    step = STEP_REGEXP.test(step) ? step : '1h';
    flat = flat === 'true';

    return (query = Object.assign({}, query, {
        fields,
        limit,
        offset,
        startDate,
        endDate,
        step,
        flat,
    }));
}

/**
 * Generates random data which should be persistent in time
 * Thanks to faker seed which allows to do so by passing current timestamp
 *
 * @param {Request} req
 * @param {Response} res
 */
function dataGeneration(query) {
    let idx = 0;
    let raw_data = [];
    let {
        fields = [],
        step,
        offset,
        limit,
        startDate,
        endDate,
        flat,
    } = inputCleanup(query);

    // Unit and size extraction
    const [_, size, unit] = step.match(STEP_REGEXP);
    const fieldNames = fields.map((field) => field[0]);
    const fakeValue = (fn) => {
        try {
            const value = faker.fake(fn);

            if (/^\d+$/.test(value)) {
                return parseFloat(value);
            }

            return value;
        } catch (e) {
            return e.message;
        }
    };

    // Faker value selector
    const of = (value) => {
        if (!value) {
            return '{{random.number}}';
        }

        // Could be enum
        if (/,/.test(value)) {
            const enums = value.split(',');
            return faker.random.arrayElement(enums);
        }

        return `{{${value}}}`;
    };

    const getElement = (stepDate, fields) =>
        fields.map((field) =>
            field[FIELD_NAME] === 'timestamp'
                ? stepDate.valueOf()
                : fakeValue(of(field[RANDOM_TYPE]))
        );

    // Data Generation
    for (;;) {
        const stepDate = startDate.clone().add(+offset + idx++ * size, unit);
        // For the realtime feature don't let generate values in future
        if (
            stepDate.isAfter(endDate) ||
            stepDate.isAfter(day()) ||
            idx > limit
        ) {
            break;
        }

        // Make random data persistent in time
        faker.seed(stepDate.unix());

        const element = getElement(stepDate, fields);

        if (flat) {
            raw_data.push(zipObject(fieldNames, element));
        } else {
            raw_data.push(element);
        }
    }

    if (flat) {
        return raw_data;
    } else {
        return {
            fields: fieldNames,
            raw_data,
        };
    }
}

module.exports = dataGeneration;
