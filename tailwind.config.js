import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.tsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Figtree', ...defaultTheme.fontFamily.sans],
            },
            colors: {
                corporate: {
                    blue: '#1b6caf',
                    'blue-dark': '#155a91',
                    green: '#89c31b',
                    'green-dark': '#78ab18',
                },
            },
            backgroundImage: {
                'gradient-corporate': 'linear-gradient(135deg, #1b6caf 0%, #155a91 100%)',
            },
        },
    },

    plugins: [forms],
};
